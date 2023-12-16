/*
RegExr: Learn, Build, & Test RegEx
Copyright (C) 2017  gskinner.com, inc.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import EventDispatcher from "./events/EventDispatcher";

import $ from "./utils/DOMUtils";
import Utils from "./utils/Utils";

import Tooltip from "./controls/Tooltip";

import Server from "./net/Server";

import Expression from "./views/Expression";
import Text from "./views/Text";
import Tools from "./views/Tools";
import app from "./app";
import Account from "./views/Account";

import Reference from "./docs/Reference";
import reference_content from "./docs/reference_content";
import Flavor from "./Flavor";

import RefCoverage from "./RefCoverage";
import Prefs from "./helpers/Prefs";

export default class RegExr extends EventDispatcher {
	constructor() { super(); }

	init(state, account, config = {}) {
		this.prefs = new Prefs();
		this.flavor = new Flavor();
		this.reference = new Reference(reference_content, this.flavor, config);
		this._migrateFavorites();
		this._initUI();
		const hEl = $.query(".header");
		const copyBtn = $.query('.button.copy')
		const successBtn = $.query('.button.check')
		copyBtn.addEventListener('click', () => {
			const text = this.expression.value
			copyBtn.style.display = 'none'
			successBtn.style.display = 'flex'
			setTimeout(() => {
				copyBtn.style.display = 'flex'
				successBtn.style.display = 'none'
			}, 500)
			navigator.clipboard.writeText(text)
			window.postMessage({
				type: 'copy',
				text: 'success'
			}, '*')
		})
		this.hNewBtn = $.query(".new", hEl);
		this.hNewBtn.addEventListener('click', () => app.newDoc())
		this.account.value = account;
		if (state === false) {
			this._localInit();
		} else if (this.account.authenticated && !state) {
			this.newDoc(false);
		} else {
			this.state = state;
		}
		this._savedHash = null;

		let params = Utils.getUrlParams();
		if (Utils.isLocal && params.id) {
			Server.load(params.id).then((o) => this.state = o);
			params = {};
		}
		if (params.engine) { this.flavor.value = params.engine; }
		if (params.expression) { this.expression.value = params.expression; }
		if (params.text) { this.text.value = params.text; }
		if (params.tool) { this.tools.value = { id: params.tool, input: params.input }; }

		window.onbeforeunload = (e) => this.unsaved ? "You have unsaved changes." : null;
		this.resetUnsaved();

		setTimeout(() => this._initAds(), 100);
	}

	_initAds() {
		_native && _native.init("CK7D65QM", { // "CK7D65QM" use "CK7D4KQE" to test Carbon ads
			carbonZoneKey: 'CK7DPKQU',
			targetClass: 'native-js'
		});
	}

	_localInit() {
		console.log("local init");
		//Server.verify().then((data) => this.account.value = data);
		new RefCoverage();
	}

	// getter / setters:
	get state() {
		let o = {
			expression: this.expression.value,
			text: this.text.value,
			tests: this.text.tests,
			flavor: this.flavor.value,
			tool: this.tools.value,
			mode: this.text.mode,
		};
		// copy share values onto the pattern object:
		return {}
	}

	set state(o) {
		if (!o) { return; }
		this.flavor.value = o.flavor;
		this.expression.value = o.expression;
		this.text.value = o.text;
		this.text.tests = o.tests;
		this.text.mode = o.mode;
		this.tools.value = o.tool;
		this.resetUnsaved();
	}

	get hash() {
		return Utils.getHashCode(
			this.expression.value + "\t"
			+ this.text.value + "\t"
			+ this.flavor.value + "\t"
			+ share.author + "\t" + share.name + "\t" + share.description + "\t" + share.keywords + "\t"
			+ JSON.stringify(this.text.tests) + "\t"
			//+ this.tools.value.input+"\t"
			//+ this.tools.value.id+"\t"
		)
	}

	get unsaved() {
		return this.hash !== this._savedHash;
	}

	get isNarrow() {
		return this._matchList.matches;
	}

	// public methods:
	resetUnsaved() {
		this._savedHash = this.hash;
	}

	newDoc(warn = true) {
		// 我希望清空编辑器中的数据初始化编辑器
		this.expression.value = ''
		this.text.value = ''
	}

	load(state, warn = true) {
		if (warn === true) { warn = "You have unsaved changes. Continue without saving?"; }
		if (warn && this.unsaved && !confirm(warn)) { return; }
		this.state = Utils.clone(state);
	}

	// private methods:
	_initUI() {
		// TODO: break into own Device class? Rename mobile.scss too?
		// mobile setup
		// keep synced with "mobile.scss":
		if (screen.width < 500) {
			document.getElementById("viewport").setAttribute("content", "width=500, user-scalable=0");
		}
		this._matchList = window.matchMedia("(max-width: 900px)");
		this._matchList.addListener((q) => this.dispatchEvent("narrow")); // currently unused.

		// UI:
		this.el = $.query(".container");

		this.tooltip = {
			hover: new Tooltip($.query("#library #tooltip").cloneNode(true)),
			toggle: new Tooltip($.query("#library #tooltip"), true)
		};


		let el = this.docEl = $.query(".app > .doc", this.el);
		this.expression = new Expression($.query("> section.expression", el));
		// /123/g
		// Expression.DEFAULT_EXPRESSION = "/([A-Z])\\w+/g";
		// 获取当前粘贴板的内容如果有 并且是正则直接给Expression.DEFAULT_EXPRESSION 作为初始化的值，否则 textarea 作为初始值

		window.navigator.clipboard.readText().then(clipboardText => {
			if (!clipboardText)
				return
			if (clipboardText.trim().match(/^\/.+[^\\]\/[a-z]*$/ig)) {
				this.expression.value = clipboardText.trim()
			} else {
				this.text.value = clipboardText
			}
		})
		this.text = new Text($.query("> section.text", el));
		this.tools = new Tools($.query("> section.tools", el));

		this.account = new Account();

		this.expression.on("change", () => this._change());
		this.text.on("change", () => this._change());
		this.text.on("modechange", () => this._modeChange());
		this.flavor.on("change", () => this._change());
		this.tools.on("change", () => this._change());
	}

	_migrateFavorites() {
		let ls = window.localStorage, l = ls.length;
		if (!l || ls.getItem("f_v3") >= "1") { return }
		let ids = [];
		for (let i = 0; i < l; i++) {
			let key = ls.key(i), val = ls.getItem(key);
			if (key[0] === "f" && val === "1") {
				ids.push(key.substr(1));
			}
		}
		if (!ids.length) { ls.setItem("f_v3", "1"); return; }
		Server.multiFavorite(ids).then(() => ls.setItem("f_v3", "1"));
	}

	_change() {
		this.dispatchEvent("change");
		let solver = this.flavor.solver, exp = this.expression;
		let o = { pattern: exp.pattern, flags: exp.flags, mode: this.text.mode };
		if (o.mode === "tests") {
			o.tests = this.text.tests;
		} else {
			o.text = this.text.value;
			o.tool = this.tools.value;
		}
		solver.solve(o, (result) => this._handleResult(result));
	}

	_modeChange() {
		$.toggleClass(this.docEl, "tests-mode", this.text.mode === "tests");
		this._change();
	}

	_handleResult(result) {
		this.result = this._processResult(result);
		this.dispatchEvent("result");
	}

	_processResult(result) {
		if (result.mode === "text") {
			result.matches && result.matches.forEach((o, i) => o.num = i);
		}
		return result;
	}
}
