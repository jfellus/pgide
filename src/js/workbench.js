
///////////
// UTILS //
///////////

function ASSERT_WORKBENCH_INIT() {if(!workbench) throw "Workbench not initialized";}



///////////////
// WORKBENCH //
///////////////




function create_workbench() {
	
	// Workbench Structure
	
	workbench = {};
	workbench.mainwindow = create_window();
	$("body").append(workbench.mainwindow);
	workbench.menubar = workbench.mainwindow.menubar;
	workbench.toolbar = workbench.mainwindow.toolbar;
	workbench.status = workbench.mainwindow.status;
	workbench.main = workbench.mainwindow.main;
	
	
	workbench.menubar.append("<li>File</li><li>Edit</li><li>Search</li><li>Help</li>");
	workbench.toolbar.append($("<li/>").addClass("new").click(function(){workbench.new_document();}));
	workbench.toolbar.append($("<li/>").addClass("open").click(function(){workbench.open();}));
	workbench.toolbar.append($("<li/>").addClass("save").click(function(){workbench.save();}));
	workbench.toolbar.append($("<li/>").addClass("close").click(function(){workbench.close();}));
	workbench.toolbar.append($("<li/>").addClass("_____"));
	workbench.toolbar.append($("<li/>").addClass("undo").click(function(){workbench.undo();}));
	workbench.toolbar.append($("<li/>").addClass("redo").click(function(){workbench.redo();}));
	workbench.toolbar.append($("<li/>").addClass("cut").click(function(){workbench.cut();}));
	workbench.toolbar.append($("<li/>").addClass("copy").click(function(){workbench.copy();}));
	workbench.toolbar.append($("<li/>").addClass("paste").click(function(){workbench.paste();}));
	workbench.toolbar.append($("<li/>").addClass("_____"));
	workbench.toolbar.append($("<li/>").addClass("create_module").click(function(){workbench.start_creator(new ModuleCreator());}));
	workbench.toolbar.append($("<li/>").addClass("create_link").click(function(){workbench.start_creator(new LinkCreator());}));
	workbench.toolbar.append($("<li/>").addClass("delete").click(function(){workbench.delete_selection();}));
	workbench.toolbar.append($("<li/>").addClass("_____"));
	workbench.toolbar.append($("<li/>").addClass("search").click(function(){workbench.search();}));
	workbench.toolbar.append($("<li/>").addClass("compile").click(function(){workbench.compile();}));
	workbench.toolbar.append($("<li/>").addClass("start").click(function(){workbench.start();}));
	workbench.toolbar.append($("<li/>").addClass("stop").click(function(){workbench.stop();}));

	
	dbg_elt = status = workbench.status;
	
	workbench.divider = create_divider();
	workbench.main.append(workbench.divider);
	
	
	workbench.ltabs = create_tabbed_pane();
	workbench.ltabs.css("overflow", "auto");
	workbench.divider.left.append(workbench.ltabs);
	workbench.rtabs = create_tabbed_pane();
	workbench.rtabs.addClass("editor");
	workbench.divider.right.append(workbench.rtabs);
	workbench.divider.right.addClass("editor");
	workbench.divider.right.css("overflow","hidden");
	workbench.divider.right.parent().css("overflow", "hidden");
	workbench.divider.right.parent().parent().css("overflow", "hidden");
	workbench.divider.setLocation(0.3);
	workbench.divider.right.disableTextSelect();
	workbench.rtabs.header.disableTextSelect();
	workbench.ltabs.header.disableTextSelect();
	
	
	
	$(document).keydown(function(e){if(!$(document.activeElement).attr('contentEditable') && !$(document.activeElement).is('input')) cur_canvas.keydown(e);	});
	$(document).keypress(function(e){if(!$(document.activeElement).attr('contentEditable') && !$(document.activeElement).is('input')) cur_canvas.keypress(e);});
	
	
	// Workbench API
	
	workbench.add_ltab = function(id, icon_cls, title, body, update_callback) {
		ASSERT_WORKBENCH_INIT();
		workbench.ltabs.add(id, icon_cls, title, body, update_callback);
	}
	
	workbench.add_rtab = function(id, icon_cls, title, body, update_callback) {
		ASSERT_WORKBENCH_INIT();
		workbench.rtabs.add(id, icon_cls, title, body, update_callback);		
	}
	
	workbench.open_view = function(title) {
		if(!workbench.ltabs.has(title)) eval("view_create_"+title.toLowerCase()+"()");
		workbench.ltabs.open(title);
	};
	
	workbench.show_editor = function(editor) {
		workbench.rtabs.open(editor.get_id());
	};
	
	workbench.on_selection = function() {
		workbench.open_view("Properties");
	};

	workbench.delete_selection = function() {
		cur_editor.delete_selection();
	}
	
	// Init creators
	workbench.start_creator = function(creator) {
		if(workbench.creator) workbench.creator.end();
		workbench.creator = creator;
		creator.start();
	};
	workbench.end_creator = function() {workbench.creator = null;};

	
	
	
	// Init commands

	workbench.close = function() {
		if(cur_editor) {
			workbench.rtabs.close(cur_editor.get_id());
			cur_editor = null;
			workbench.open_view("Properties");
			workbench.open_view("Script");
		}
	};

	workbench.open = function(filename) {
		if(!filename) file_open_dialog(function(filename) { workbench.open(filename);});
		else {
			if(workbench.rtabs.has(encode_editor_id(filename))) workbench.rtabs.close(encode_editor_id(filename));
			var editor = new Editor(filename);
			file_read_array(filename, function(content) {
				cur_editor.cur_file = filename;
				editor.read_model(content);
			});
		}
	};
	
	workbench.new_document = function() {
		var i = 0;
		while(workbench.rtabs.has("new_script_"+i)) i++;
		return new Editor("new_script_"+i);
	};
	
	workbench.save = function(filename) {
		if(!filename) filename = cur_editor.cur_file;
		if(!filename) file_open_dialog(function(filename) { workbench.save(filename);});
		else {
			var content = cur_editor.write_model();
			file_write(filename, content);
			cur_editor.cur_file = filename;
			cur_editor.set_filename(filename);
		}
	};
	
	workbench.compile = function() {
		cur_editor.compile_model();
	};
	
	workbench.start = function() {
		cur_editor.start_model();
	}
	
	
	
	
	//////////////////
	// KEY BINDINGS //
	//////////////////
	
	workbench.on_keydown = function(e) {
		var k = String.fromCharCode(e.which);
		if(k=='M') workbench.start_creator(new ModuleCreator());
		else if(k=='L') workbench.start_creator(new LinkCreator());
		else if(k=='W') workbench.close();
		else if(k=='O') workbench.open();
		else if(k=='N') workbench.new_document();
		else if(k=='S') workbench.save();	
		else if(k=='B') workbench.compile();
		else if(e.which==46) workbench.delete_selection();
	};
}



///////////
// VIEWS //
///////////


function View(icon_cls, title) {
	this.icon_cls = icon_cls;
	this.title = title;
	var _this = this;
	workbench.add_ltab(title, icon_cls, title, "", function(elt) {_this.update(elt);});
}


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
		var dep = $("<ul class='editable_list' contentEditable=true></ul>");
		e.append(dep);
		list_append_array(dep, cur_editor.script.p.depends);
		dep.keyup(function() { cur_editor.script.set_property("depends", get_list_array(dep));});
		
		e.append(dep);
	}
}