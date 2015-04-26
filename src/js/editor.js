var cur_canvas = null;
var cur_editor = null;


function encode_editor_id(filename) {return filename.replaceAll("/", "_").replaceAll("\\.", "___").replaceAll(" ", "____");}


function Editor(filename) {
	this.filename = filename;
	this.id = encode_editor_id(filename);
	this.script = new Script(filename);
	
	this.canvas = null;
	
	this.modules = [];
	this.links = [];
	
	this.selection = [];

	
	this.create_canvas = function() {
		var _editor = this;
		var canvas = create_canvas();
		$(window).resize(function() {canvas.update();});
		workbench.add_rtab(this.id, null, file_basename(filename), canvas, function() {canvas.update();});
		workbench.rtabs.close(function(id){
			if(id!=_editor.id) return true;
			if(_editor.bModified) {
				if(confirm("Script has been modified. Save changes ?")) workbench.save();
				else return (confirm("Close without saving ?")); 
			}
			return true;
		});
		canvas.parent().parent().css("overflow", "hidden");
		canvas.parent().css("overflow", "hidden");
		
		canvas.start_edit_text = function(t) {
			if(canvas.cur_edited_text) SVG_REMOVE_CLASS(t, "edit");
			SVG_ADD_CLASS(t, "edit");
			canvas.cur_edited_text = t;
		}
		canvas.end_edit_text = function() {
			if(canvas.cur_edited_text) SVG_REMOVE_CLASS(canvas.cur_edited_text, "edit");
			canvas.cur_edited_text = null;
		}
		canvas.keypress = function(e) { if(canvas.cur_edited_text) return on_text_keypress(e); };
		canvas.keydown = function(e) { if(canvas.cur_edited_text) return on_text_keydown(e); workbench.on_keydown(e);};
		var _this = this;
		canvas.on_update = function() { cur_editor = _this; _this.update(); };

		canvas.mousemove(function(e) {if(workbench.creator) workbench.creator.move(canvas.relX(e.offsetX), canvas.relY(e.offsetY));});
		canvas.click(function(e) {if(workbench.creator) workbench.creator.create();});
		this.canvas = canvas;
		cur_canvas = canvas;
	};
	
	
	this.get_module_by_name = function(name) {
		for(var i = 0; i<this.modules.length; i++) if(this.modules[i].p.name==name) return this.modules[i];
		return null;
	};


	this.add_selection = function(o) {this.selection.push(o);};

	this.unselect_all = function() {
		while(this.selection.length>0) this.selection[0].unselect();
		workbench.on_selection();
		this.canvas.focus();
		workbench.open_view("Script");
	};

	this.select_all = function() {
		for(var i = 0; i<this.modules.length; i++) this.modules[i].select();
		for(var i = 0; i<this.links.length; i++) this.links[i].select();
	};

	this.has_selection = function() {return this.selection.length>0;};

	this.get_selected_module = function() {
		if(this.selection.length==1 && this.selection[0].outs) return this.selection[0];
		return null;
	};

	this.get_selected_link = function() {
		if(this.selection.length==1 && this.selection[0].src) return this.selection[0];
		return null;
	};


	this.set_selection_property = function(key, val) {
		for(var i = 0; i < this.selection.length; i++) {
			this.selection[i].set_property(key, val);
		}
	};
	
	this.delete_selection = function(key, val) {
		while(this.selection.length>0) this.selection[0].remove();
	}
	
	this.set_modified = function(bModified) { 
		this.bModified = bModified; 
		workbench.rtabs.set_title(this.id, (bModified ? "*" : "")+file_basename(this.filename));
	};
	
	this.set_filename = function(filename) {
		this.filename = filename;
		workbench.rtabs.set_title(this.id, (this.bModified ? "*" : "")+file_basename(filename));
		var id = encode_editor_id(filename);
		workbench.rtabs.change_id(this.id, id);
		this.id = id;
	}

	this.update = function() {};
	

	////////
	// IO //
	////////

	this.cur_module = null;
	this.cur_link = null;
	this.read_model = function(statements) {
		this.section = "header";
		for(var i = 0; i<statements.length; i++) {
			var s = statements[i].trim();
			if(s.indexOf("#")!==-1) s = s.substring(0, s.indexOf("#")).trim();
			if(s.length==0) continue;
			
			if(s[0]=='[') this.section = s.substr(1,s.length-2);
			else try {
				eval("this.execute_statement_"+this.section.toLowerCase()+"(s)");
			} catch(e) { alert("SYNTAX ERROR : " + s+ " : " + (e.stack ? e.stack : e));}
		}
		this.update();
		this.set_modified(false);
		workbench.open_view("Script");
	}

	this.execute_statement_header = function(s) {
		if(s.startsWith("Script")) this.script.p.name = s.split(" ")[1].trim();
		else if(s.startsWith("Depends")) {this.script.p.depends.push(s.split(" ")[1].trim());}
	}

	this.execute_statement_modules = function(s) {
		if(!s.has("=")) this.cur_module = new Module(this, Math.random()*this.canvas.width(), Math.random()*this.canvas.height(), s.split(" ")[0].trim(), s.split(" ")[1].trim());
		else {
			if(!this.cur_module) throw "Syntax error : "+s;
			var key = s.split("=")[0].trim();
			var val = s.split("=")[1].trim();
			if(key[0]=='@') key = key.substring(1,key.length); 
			this.cur_module.set_property(key, val);
		}
	}

	this.execute_statement_links = function(s) {
		if(!s.has("=")) {
			var _src = s.substring(0, s.indexOf("-")).trim();
			var _dst = s.substring(s.indexOf(">")+1, s.length).trim();
			var type = s.substring(s.indexOf("-")+1, s.indexOf(">"));
			var src_pin = _src; if(src_pin.has(".")) {src_pin = src_pin.substring(src_pin.indexOf(".")+1,src_pin.length); _src = _src.substring(0, _src.indexOf("."));}
			var dst_pin = _dst; if(dst_pin.has(".")) {dst_pin = dst_pin.substring(dst_pin.indexOf(".")+1,dst_pin.length); _dst = _dst.substring(0, _dst.indexOf("."));}
			var src = this.get_module_by_name(_src);
			var dst = this.get_module_by_name(_dst);
			if(!src) throw "No such module : " + _src;
			if(!dst) throw "No such module : " + _dst;
			this.cur_link = new Link(this, src, dst);
			this.cur_link.p.type = type;
			this.cur_link.update();
		} else {
			if(!this.cur_link) throw "Syntax error : "+s;
			this.cur_link.set_property(s.split("=")[0].trim(), s.split("=")[1].trim());
		}
	}

	this.write_model = function() {
		var s = "Script " + this.script.p.name + "\n";
		if(this.script.p.depends)
			for(var i = 0; i<this.script.p.depends.length; i++) s+="Depends "+ this.script.p.depends[i]+"\n";
		s+="\n";
		
		s+="[Modules]\n";
		for(var i =0;i<this.modules.length;i++) {
			s+= this.modules[i].p.type + " " + this.modules[i].p.name + "\n";
			for(var key in this.modules[i].p) {
				if(!key.trim()) continue;
				if(key=="name" || key=="type") continue;
				var k = (key=="x" || key=="y") ? "@"+key : key;
				if(this.modules[i].p[key]) 
					s+=k + " = " + this.modules[i].p[key] + "\n";
			}
			s+="\n";
		}
		s+="\n";
		

		s+="[Links]\n";
		for(var i =0;i<this.links.length;i++) {
			var src = this.links[i].p.src + (this.links[i].p.src_pin ? "." + this.links[i].p.src_pin : "");
			var dst = this.links[i].p.dst + (this.links[i].p.dst_pin ? "." + this.links[i].p.dst_pin : "");
			s+= src + " -" + this.links[i].p.type + "> " + dst + "\n";
			for(var key in this.links[i].p) {
				if(!key.trim()) continue;
				if(key=="src" || key=="dst" || key=="src_pin" || key=="dst_pin" || key=="type") continue;
				if(this.links[i].p[key])
					s+=key + " = " + this.links[i].p[key] + "\n";
			}
			s+="\n";
		}
		this.set_modified(false);
		return s;
	};
	
	this.get_id = function() {return this.id;};
	

	

	/////////////////
	// COMPILATION //
	/////////////////

	this.compile_model = function(_on_done) {
		var on_done = _on_done;
		var _editor = this;
		var output = file_dirname(this.filename)+"/build_"+file_basename(this.filename);
		exec_async("pgcc "+this.filename + " "+output, function(err,stdout,stderr){
			if(stderr.length>0) alert(stderr);
			if(stdout.length>0) alert(stdout);
			else {
				DBG("CPP Code for " + _editor.filename + " successfully generated to " + output +" !!");
				exec_async("cd "+ output + ";make", function(err,stdout,stderr) {
					if(stderr.length>0) _editor.report_compilation_errors(stderr);
					else _editor.report_compilation_errors(cur_editor.filename + " successfully compiled in " + output +" !!");
					
					if(on_done) on_done();
				});
			}
		});
	};
	
	this.report_compilation_errors = function(err) {
		cur_compilation_errors = err;
		workbench.open_view("Errors");
	};

	
	
	///////////////
	// EXECUTION //
	///////////////
	
	this.start_model = function() {
		var _editor = this;
		this.compile_model(function() {
			var output = file_dirname(_editor.filename)+"/build_"+file_basename(_editor.filename);
			exec_async("cd "+ output + "; ./main", function(err, stdout, stderr) {
				 _editor.report_console(stderr, stdout);
			});
		});
	};
	
	this.report_console = function(stderr, stdout) {
		cur_console = "<pre class='stderr'>"+stderr+"</pre><pre class='stdout'>"+stdout+"</pre>";
		workbench.open_view("Console");
	};
	
	
	
	
	
	
	
	
	
	
	////////////////////////0




	
	
	this.create_canvas();
	cur_editor = this;
	workbench.show_editor(this);
	workbench.open_view("Script");
}



