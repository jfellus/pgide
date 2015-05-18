
function view_create_properties() {
	var v2 = new View(null, "Properties");
	v2.update = function(e) {
		e.empty();
		if(cur_editor && cur_editor.has_selection()) {
			var o = cur_editor.selection[0];
			e.append(create_table_from_data_plus(o.p, function(key, val) { cur_editor.set_selection_property(key, val);}));
		}
	};
}



function view_create_errors() {
	var v = new View(null, "Errors");
	v.update = function(e) {
		e.empty();
		e.addClass("view_errors");
		e.html('<pre>'+cur_compilation_errors+'</pre>');
		if(!cur_compilation_errors) { e.html("Everything went fine !"); e.addClass("compilation_ok"); e.removeClass("compilation_failed");}
		else {e.addClass("compilation_failed"); e.removeClass("compilation_ok");}
	}
}
var cur_compilation_errors = "";



function view_create_console() {
	var v = new View(null, "Console");
	v.update = function(e) {
		e.empty();
		e.addClass("view_console");
		e.html(cur_console);
	}
}
var cur_console = "";



function view_create_script() {
	var v = new View(null, "Script");
	v.update = function(e) {
		e.empty();
		if(!cur_editor) return;
		e.addClass("view_script");
		e.append("<h3 class='depends'>Properties</h3>");
		e.append(create_table_from_data(cur_editor.script.p, function(key, val) { cur_editor.script.set_property(key, val);}, ["depends"]));
		
		e.append("<h3 class='depends'>Depends</h3>");
		var dep = $("<ul contentEditable='true' class='editable_list'></ul>");
		list_append_array(dep, cur_editor.script.p.depends);
		dep.keyup(function(){
			cur_editor.script.set_property("depends", get_list_array(dep));	
		});
		e.append(dep);
	}
}