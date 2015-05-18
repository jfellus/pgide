
///////////
// UTILS //
///////////

function ASSERT_WORKBENCH_INIT() {if(!workbench) throw "Workbench not initialized";}



///////////////
// WORKBENCH //
///////////////

function Workbench() {
	
	/////////////////////////
	// Workbench Structure //
	/////////////////////////
	
	this.mainwindow = create_window();
	$("body").append(this.mainwindow);
	this.menubar = this.mainwindow.menubar;
	this.toolbar = this.mainwindow.toolbar;
	this.status = this.mainwindow.status;
	this.main = this.mainwindow.main;
	
	// Menubar
	this.menubar.append("<li>File</li><li>Edit</li><li>Search</li><li>Help</li>");
	
	// Toolbar
	this.toolbar.append($("<li/>").addClass("new").click(function(){workbench.new_document();}));
	this.toolbar.append($("<li/>").addClass("open").click(function(){workbench.open();}));
	this.toolbar.append($("<li/>").addClass("save").click(function(){workbench.save();}));
	this.toolbar.append($("<li/>").addClass("close").click(function(){workbench.close();}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("undo").click(function(){workbench.undo();}));
	this.toolbar.append($("<li/>").addClass("redo").click(function(){workbench.redo();}));
	this.toolbar.append($("<li/>").addClass("cut").click(function(){workbench.cut();}));
	this.toolbar.append($("<li/>").addClass("copy").click(function(){workbench.copy();}));
	this.toolbar.append($("<li/>").addClass("paste").click(function(){workbench.paste();}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("create_module").click(function(){workbench.start_creator(new ModuleCreator());}));
	this.toolbar.append($("<li/>").addClass("create_link").click(function(){workbench.start_creator(new LinkCreator());}));
	this.toolbar.append($("<li/>").addClass("delete").click(function(){workbench.delete_selection();}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("search").click(function(){workbench.search();}));
	this.toolbar.append($("<li/>").addClass("compile").click(function(){workbench.compile();}));
	this.toolbar.append($("<li/>").addClass("start").click(function(){workbench.start();}));
	this.toolbar.append($("<li/>").addClass("stop").click(function(){workbench.stop();}));

	
	status = this.status; dbg_elt = this.status;
	this.divider = create_divider();
	this.main.append(this.divider);
	
	this.ltabs = create_tabbed_pane();
	this.ltabs.css("overflow", "auto");
	this.divider.left.append(this.ltabs);
	this.rtabs = create_tabbed_pane();
	this.rtabs.addClass("editor");
	this.divider.right.append(this.rtabs);
	this.divider.right.addClass("editor");
	this.divider.right.css("overflow","hidden");
	this.divider.right.parent().css("overflow", "hidden");
	this.divider.right.parent().parent().css("overflow", "hidden");
	this.divider.setLocation(0.3);
	this.divider.right.disableTextSelect();
	this.rtabs.header.disableTextSelect();
	this.ltabs.header.disableTextSelect();
			
	$(document).keydown(function(e){if(cur_canvas && !$(document.activeElement).attr('contentEditable') && !$(document.activeElement).is('input')) cur_canvas.keydown(e);	});
	$(document).keypress(function(e){if(cur_canvas && !$(document.activeElement).attr('contentEditable') && !$(document.activeElement).is('input')) cur_canvas.keypress(e);});
	
	
	///////////////////
	// Workbench API //
	///////////////////
	
	this.add_ltab = function(id, icon_cls, title, body, update_callback) {
		ASSERT_WORKBENCH_INIT();
		this.ltabs.add(id, icon_cls, title, body, update_callback);
	};
	
	this.add_rtab = function(id, icon_cls, title, body, update_callback) {
		ASSERT_WORKBENCH_INIT();
		this.rtabs.add(id, icon_cls, title, body, update_callback);		
	};
	
	this.open_view = function(title) {
		if(this.ltabs.has(title)) this.ltabs.open(title);
		else if(this.rtabs.has(title)) this.rtabs.open(title);
		else eval("view_create_"+title.toLowerCase()+"()");
		
		if(this.ltabs.has(title)) this.ltabs.open(title);
		if(this.rtabs.has(title)) this.rtabs.open(title);		
	};
	
	this.show_editor = function(editor) {
		this.rtabs.open(editor.get_id());
	};
	
	this.on_selection = function() {
		this.open_view("Properties");
	};

	this.delete_selection = function() {
		cur_editor.delete_selection();
	};
	
	this.start_creator = function(creator) {
		if(this.creator) this.creator.end();
		this.creator = creator;
		creator.start();
	};
	this.end_creator = function() {this.creator = null;};

	
	//////////////
	// Commands //
	//////////////

	this.close = function() {
		if(cur_editor) {
			this.rtabs.close(cur_editor.get_id());
			cur_editor = null;
			this.open_view("Properties");
			this.open_view("Script");
		}
	};

	this.open = function(filename) {
		if(!filename) file_open_dialog(function(filename) { workbench.open(filename);}, "*.script");
		else {
			if(this.rtabs.has(encode_editor_id(filename))) this.rtabs.close(encode_editor_id(filename));
			var editor = new Editor(filename);
			file_read_array(filename, function(content) {
				cur_editor.cur_file = filename;
				editor.read_model(content);
			});
		}
	};
	
	this.new_document = function() {
		var i = 0;
		while(this.rtabs.has("new_script_"+i)) i++;
		return new Editor("new_script_"+i);
	};
	
	this.save = function(filename) {
		if(!filename) filename = cur_editor.cur_file;
		if(!filename) file_save_as_dialog(function(filename) { workbench.save(filename);}, "*.script");
		else {
			var content = cur_editor.write_model();
			file_write(filename, content);
			cur_editor.cur_file = filename;
			cur_editor.set_filename(filename);
		}
	};
	
	this.compile = function() {
		cur_editor.compile_model();
	};
	
	this.start = function() {
		cur_editor.start_model();
	};
	
	
	
	
	//////////////////
	// KEY BINDINGS //
	//////////////////
	
	this.on_keydown = function(e) {
		var k = String.fromCharCode(e.which);
		if(e.ctrlKey) {
			if(k=='W') this.close();
			else if(k=='O') this.open();
			else if(k=='N') this.new_document();
			else if(k=='S') this.save();	
			else if(k=='B') this.compile();
		} else {
			if(k=='M') this.start_creator(new ModuleCreator());
			else if(k=='L') this.start_creator(new LinkCreator());
			else if(k=='A') cur_editor.align_selection();
			else if(e.which==40 /* down */) cur_editor.dragg_selection(0,5);
			else if(e.which==38 /* up */) cur_editor.dragg_selection(0,-5);
			else if(e.which==37 /* left */) cur_editor.dragg_selection(-5,0);
			else if(e.which==39 /* right */) cur_editor.dragg_selection(5,0);
			else if(e.which==46 /* suppr */) this.delete_selection();
		}
	};
}



///////////
// VIEWS //
///////////


function View(icon_cls, title, flags) {
	this.icon_cls = icon_cls;
	this.title = title;
	this.flags = flags;
	var _this = this;
	if(flags && flags.tab=="right") workbench.add_rtab(title, icon_cls, title, "", function(elt) {_this.update(elt);});
	else workbench.add_ltab(title, icon_cls, title, "", function(elt) {_this.update(elt);});
}

