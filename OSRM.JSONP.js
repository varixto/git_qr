/*
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU AFFERO General Public License as published by
the Free Software Foundation; either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
or see http://www.gnu.org/licenses/agpl.txt.
*/

// OSRM JSONP call wrapper 
// [wrapper for JSONP calls with DOM cleaning, fencing, timout handling]


OSRM.JSONP = {
		
	// storage to keep track of unfinished JSONP calls
	fences: {},
	callbacks: {},
	timeouts: {},
	timers: {},
	
	
	// default callback routines
	late: function() { /*OSRM.debug.log("[jsonp] reply too late");*/ },	
	empty: function() { /*OSRM.debug.log("[jsonp] empty callback");*/ },
	
	
	// init JSONP call
	call: function(source, callback_function, timeout_function, timeout, id, parameters) {
		// only one active JSONP call per id
		if (OSRM.JSONP.fences[id] == true)
			return false;
		OSRM.JSONP.fences[id] = true;
		
		// wrap timeout function
		OSRM.JSONP.timeouts[id] = function(response) {
			try {
				timeout_function(response, parameters);
			} finally {
				OSRM.JSONP.callbacks[id] = OSRM.JSONP.late;				// clean functions
				OSRM.JSONP.timeouts[id] = OSRM.JSONP.empty;
				OSRM.JSONP.fences[id] = undefined;						// clean fence
			}
			
//			OSRM.debug.log("[jsonp] timout handling: "+id);
		};
		
		// wrap callback function
		OSRM.JSONP.callbacks[id] = function(response) {
			clearTimeout(OSRM.JSONP.timers[id]);						// clear timeout timer
			OSRM.JSONP.timers[id] = undefined;
			
			try {
				callback_function(response, parameters);				// actual wrapped callback 
			} finally {
				OSRM.JSONP.callbacks[id] = OSRM.JSONP.empty;			// clean functions
				OSRM.JSONP.timeouts[id] = OSRM.JSONP.late;
				OSRM.JSONP.fences[id] = undefined;						// clean fence
			}
			
//			OSRM.JSONP.sum[id] += new Number( new Date() - OSRM.JSONP.durations[id] );
//			OSRM.debug.log("[jsonp] response handling: "+id+" "+ (OSRM.JSONP.sum[id]/OSRM.JSONP.counter[id]).toFixed(2) );
		};
		
		// clean DOM (unfortunately, script elements cannot be reused by all browsers)
		var jsonp = document.getElementById('jsonp_'+id);
		if(jsonp)
			jsonp.parentNode.removeChild(jsonp);
		
		// add script to DOM
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = 'jsonp_'+id;
		script.src = source + "&json_callback=OSRM.JSONP.callbacks."+id + "&jsonp=OSRM.JSONP.callbacks."+id;
		document.head.appendChild(script);
		
		// start timeout timer
		OSRM.JSONP.timers[id] = setTimeout(OSRM.JSONP.timeouts[id], timeout);
		
//		if(!OSRM.JSONP.durations) { OSRM.JSONP.durations = {}; OSRM.JSONP.counter = {}; OSRM.JSONP.sum = {}; }
//		if(OSRM.JSONP.counter[id]) OSRM.JSONP.counter[id]++; else {OSRM.JSONP.counter[id] = 1;OSRM.JSONP.sum[id] = 0;}
//		OSRM.JSONP.durations[id] = new Date();		
//		OSRM.debug.log("[jsonp] init: "+id);
		
		return true;
	},
	
	// reset all data
	reset: function() {
		OSRM.JSONP.fences = {};
		OSRM.JSONP.callbacks = {};
		OSRM.JSONP.timeouts = {};
		OSRM.JSONP.timers = {};
	}
};
