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

let home = {};
export default home;

home.id = "home";
home.label = "Menu";
home.desc = "[from HTML]";
home.kids = [
	{
	label: "Cheatsheet",
	id:"cheatsheet",
	el: "#cheatsheet"
	},

	{ // injected from Reference
	id:"reference"
	},
];
