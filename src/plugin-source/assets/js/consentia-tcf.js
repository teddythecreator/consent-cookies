/**
 * Consentia — IAB Transparency & Consent Framework v2.2 (core).
 *
 * Registers the standard __tcfapi command API and encodes a valid
 * TC string (core string, purpose-level) from the Consentia consent
 * state. Purpose mapping:
 *
 *   necessary   → purpose 1 (legitimate interest, always on)
 *   functional  → purposes 3, 5, 6
 *   analytics   → purposes 7, 8, 9, 10
 *   performance → purposes 7, 8, 9, 10
 *   advertising → purposes 2, 3, 4
 *
 * @package Consentia
 */
(function () {
	'use strict';

	var data = window.consentiaData || {};
	var settings = data.settings || {};
	var CMP_VERSION = 1;
	var TCF_POLICY_VERSION = 4; // TCF v2.2
	var VENDOR_LIST_VERSION = 2;

	/* ------------------------------------------------- bit writer ---- */

	function BitWriter() {
		this.bits = [];
	}

	BitWriter.prototype.writeInt = function (value, numBits) {
		if (numBits > 32) {
			this.writeInt(Math.floor(value / 4294967296), numBits - 32);
			this.writeInt(value % 4294967296, 32);
			return;
		}
		for (var i = numBits - 1; i >= 0; i--) {
			this.bits.push((value >>> i) & 1);
		}
	};

	BitWriter.prototype.writeBool = function (v) {
		this.bits.push(v ? 1 : 0);
	};

	BitWriter.prototype.writeLetter = function (ch) {
		this.writeInt(ch.toUpperCase().charCodeAt(0) - 65, 6);
	};

	BitWriter.prototype.writeBitfield = function (setIds, maxId) {
		for (var i = 1; i <= maxId; i++) {
			this.bits.push(setIds.indexOf(i) > -1 ? 1 : 0);
		}
	};

	BitWriter.prototype.encode = function () {
		while (this.bits.length % 8 !== 0) {
			this.bits.push(0);
		}
		var raw = '';
		for (var i = 0; i < this.bits.length; i += 8) {
			var byte = 0;
			for (var j = 0; j < 8; j++) {
				byte = (byte << 1) | this.bits[i + j];
			}
			raw += String.fromCharCode(byte);
		}
		return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	};

	/* --------------------------------------------------- purposes ---- */

	function consentedPurposes(consent) {
		var set = [];
		if (consent.functional) {
			set.push(3, 5, 6);
		}
		if (consent.analytics || consent.performance) {
			set.push(7, 8, 9, 10);
		}
		if (consent.advertising) {
			set.push(2, 3, 4);
		}
		return Array.from(new Set(set));
	}

	function maxPurpose(set) {
		return set.length ? Math.max.apply(null, set) : 0;
	}

	/* ------------------------------------------------- TC string ---- */

	function encodeTCString(consent) {
		var w = new BitWriter();
		var now = Math.floor(Date.now() / 100); // deciseconds
		var purposes = consentedPurposes(consent);
		var li = [1]; // Storage and access — legitimate interest.
		var lang = (settings.tcf_publisher_cc || 'ES').toUpperCase();
		var cmpId = parseInt(settings.tcf_cmp_id || 0, 10);

		w.writeInt(2, 6); // Version
		w.writeInt(now, 36); // Created
		w.writeInt(now, 36); // LastUpdated
		w.writeInt(cmpId, 12); // CMP ID
		w.writeInt(CMP_VERSION, 12); // CMP version
		w.writeInt(2, 6); // Consent screen
		w.writeLetter(lang.charAt(0)); // Consent language
		w.writeLetter(lang.charAt(1));
		w.writeInt(VENDOR_LIST_VERSION, 12); // Vendor list version
		w.writeInt(TCF_POLICY_VERSION, 6); // Policy version (v2.2)
		w.writeBool(false); // IsServiceSpecific
		w.writeBool(false); // UseNonStandardStacks
		w.writeInt(0, 12); // Special feature opt-ins
		w.writeBitfield(purposes, 24); // Purpose consents
		w.writeBitfield(li, 24); // Purpose legitimate interests
		w.writeBool(false); // Purpose one treatment
		w.writeLetter(lang.charAt(0)); // Publisher CC
		w.writeLetter(lang.charAt(1));
		w.writeInt(0, 16); // Max vendor ID (consent)
		w.writeBool(false); // Bitfield encoding
		w.writeInt(0, 16); // Max vendor ID (LI)
		w.writeBool(false); // Bitfield encoding

		return w.encode();
	}

	/* ----------------------------------------------------- status ---- */

	function currentConsent() {
		if (window.Consentia && window.Consentia.status) {
			return window.Consentia.status();
		}
		return { necessary: true, functional: false, analytics: false, performance: false, advertising: false, decided: false };
	}

	function mapToObject(ids, total) {
		var out = {};
		for (var i = 1; i <= total; i++) {
			out[i] = ids.indexOf(i) > -1;
		}
		return out;
	}

	function buildTCData(eventStatus) {
		var consent = currentConsent();
		var purposes = consentedPurposes(consent);
		return {
			tcString: encodeTCString(consent),
			tcfPolicyVersion: TCF_POLICY_VERSION,
			cmpId: parseInt(settings.tcf_cmp_id || 0, 10),
			cmpVersion: CMP_VERSION,
			gdprApplies: true,
			eventStatus: eventStatus,
			cmpStatus: 'loaded',
			isServiceSpecific: false,
			useNonStandardStacks: false,
			purposeOneTreatment: false,
			publisherCC: (settings.tcf_publisher_cc || 'ES').toUpperCase(),
			purpose: {
				consents: mapToObject(purposes, 24),
				legitimateInterests: mapToObject([1], 24)
			},
			vendor: {
				consents: {},
				legitimateInterests: {}
			},
			specialFeatureOptins: mapToObject([], 12),
			outOfBand: {
				allowedVendors: {},
				disclosedVendors: {}
			}
		};
	}

	/* ------------------------------------------------- __tcfapi ---- */

	var listeners = [];
	var cmpShown = false;

	function notify(eventStatus) {
		var tc = buildTCData(eventStatus);
		listeners.forEach(function (cb) {
			try {
				cb(tc, true);
			} catch (e) {}
		});
	}

	window.__tcfapi = function (command, version, callback) {
		if (typeof callback !== 'function') {
			return;
		}
		switch (command) {
			case 'ping':
				callback(
					{
						gdprApplies: true,
						cmpLoaded: true,
						cmpStatus: 'loaded',
						displayStatus: cmpShown ? 'visible' : 'hidden',
						apiVersion: '2',
						cmpVersion: CMP_VERSION
					},
					true
				);
				break;
			case 'getTCData':
				callback(buildTCData(cmpShown ? 'useractioncomplete' : 'tcloaded'), true);
				break;
			case 'addEventListener':
				listeners.push(callback);
				callback(buildTCData('tcloaded'), true);
				break;
			case 'removeEventListener':
				listeners = listeners.filter(function (cb) {
					return cb !== callback;
				});
				callback(true, true);
				break;
			default:
				callback({ message: 'Unsupported command: ' + command }, false);
		}
	};

	document.addEventListener('consentia:granted', function () {
		cmpShown = true;
		notify('useractioncomplete');
	});

	document.addEventListener('consentia:updated', function () {
		notify('useractioncomplete');
	});
})();
