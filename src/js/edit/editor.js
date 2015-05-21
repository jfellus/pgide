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

		canvas.on_update = function() { cur_editor = _editor; _editor.update(); };

		canvas.mousemove(function(e) {if(workbench.creator) workbench.creator.move(canvas.relX(e.offsetX), canvas.relY(e.offsetY));});
		canvas.click(function(e) {if(workbench.creator) workbench.creator.create();});
		
		workbench.add_rtab(this.id, null, file_basename(filename), canvas, function() {_editor.focus();});
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
		
		cur_canvas = this.canvas = canvas;
	};
	
	this.focus = function() {
		this.canvas.update();
		workbench.open_view("Script");
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

	this.select_rectangle = function(x,y,w,h) {
		this.unselect_all();
		for(var i = 0; i<this.modules.length; i++) {
			if(this.modules[i].is_in(x,y,w,h)) this.modules[i].select();
		}
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
		var old = [];
		for(var i = 0; i < this.selection.length; i++) {
			old.push({what:this.selection[i],key:key,oldval:this.selection[i].p[key],newval:val});
			this.selection[i].apply_property(key, val);
		}
		
		this.add_command(new CommandSetProperty(old));
		this.set_modified(true);
	};
	
	this.delete_selection = function(key, val) {
		if(!this.selection || !this.selection.length) return;
		this.add_command(new CommandDelete(this.selection.slice ? this.selection.slice() : [this.selection]));
		if(this.selection.slice) while(this.selection.length>0) this.selection[0].detach();
		else this.selection.remove();
	};
	
	this.move_selection = function(dx,dy) {
		this.dragg_selection(dx,dy);
		this.on_selection_moved();
		workbench.open_view("Properties");
	};
	
	this.dragg_selection = function(dx,dy) {
		if(!this.drag_command_data) {
			this.drag_command_data = [];
			for(var i = 0; i < this.selection.length; i++) {
				if(this.selection[i].elt.move) {
					this.drag_command_data.push({what:this.selection[i],key:"x",oldval:this.selection[i].p.x});
					this.drag_command_data.push({what:this.selection[i],key:"y",oldval:this.selection[i].p.y});
				}
			}
		}
		
		for(var i = 0; i < this.selection.length; i++) {
			if(this.selection[i].elt.move) this.selection[i].elt.move(dx,dy);
		}
	};
	
	this.on_selection_moved = function() {
		if(this.drag_command_data) {
			var j = 0;
			for(var i = 0; i < this.selection.length; i++) {
				if(this.selection[i].elt.move) {
					this.drag_command_data[j*2].newval = this.selection[i].p.x;
					this.drag_command_data[j*2+1].newval = this.selection[i].p.y;
					j++;
				}
			}
			this.add_command(new CommandSetProperty(this.drag_command_data));
			this.drag_command_data = null;
		}
		this.set_modified(true); 
	};
	
	this.set_modified = function(bModified) { 
		this.bModified = bModified; 
		workbench.rtabs.set_title(this.id, (bModified ? "*" : "")+file_basename(this.filename));
	};
	
	this.clear = function() {
		this.unselect_all();
		this.modules=[];
		this.links=[];
		this.canvas.clear();
	};
	
	this.set_filename = function(filename) {
		this.filename = filename;
		workbench.rtabs.set_title(this.id, (this.bModified ? "*" : "")+file_basename(filename));
		var id = encode_editor_id(filename);
		workbench.rtabs.change_id(this.id, id);
		this.id = id;
	};

	this.update = function() {};
	
	
	this.update_all_svg = function() {
		for(var i = 0; i<this.modules.length; i++) {
			this.modules[i].elt.update_svg(this.modules[i].p.type);
		}
	};
	
	this.align_selection = function() {
		if(this.selection.length<=1) return;
		
		var minx=Number.MAX_VALUE, maxx=-Number.MAX_VALUE, miny=Number.MAX_VALUE; maxy=-Number.MAX_VALUE;
		for(var i = 0; i<this.selection.length; i++) {
			if(!this.selection[i].elt.move) continue;
			if(this.selection[i].p.x < minx) minx = this.selection[i].p.x;
			if(this.selection[i].p.x > maxx) maxx = this.selection[i].p.x;
			if(this.selection[i].p.y < miny) miny = this.selection[i].p.y;
			if(this.selection[i].p.y > maxy) maxy = this.selection[i].p.y;
		}
		
		if(maxx-minx > maxy-miny) this.align_selection_H(); else this.align_selection_V();
	};
	
	this.align_selection_H = function() {
		if(this.selection.length<=1) return;
		
		var min=Number.MAX_VALUE, max=-Number.MAX_VALUE;
		var y=0;
		var list = [];
		var old = [];
		for(var i = 0; i<this.selection.length; i++) {
			if(!this.selection[i].elt.move) continue;
			if(this.selection[i].p.x < min) min = this.selection[i].p.x;
			if(this.selection[i].p.x > max) max = this.selection[i].p.x;
			y += this.selection[i].p.y;
			list.push({i:i,x:this.selection[i].p.x});
			old.push({module:this.selection[i],oldx:this.selection[i].p.x,oldy:this.selection[i].p.y});
		}
		y/=list.length;
		list.sort(function(a,b){return (a.x<b.x) ? -1 : 1;});
		var dx = (max-min)/(list.length-1);
		for(var j=0; j<list.length; j++) {
			this.selection[list[j].i].set_pos(min, y);
			old[j].newx = min;
			old[j].newy = y;
			min += dx;
		}
		
		this.add_command(new CommandAlign(old));
	};
	
	this.align_selection_V = function() {
		if(this.selection.length<=1) return;
		
		var min=Number.MAX_VALUE, max=-Number.MAX_VALUE;
		var x = 0;
		var list = [];
		var old = [];
		for(var i = 0; i<this.selection.length; i++) {
			if(!this.selection[i].elt.move) continue;
			if(this.selection[i].p.y < min) min = this.selection[i].p.y;
			if(this.selection[i].p.y > max) max = this.selection[i].p.y;
			x+=this.selection[i].p.x;
			list.push({i:i,y:this.selection[i].p.y});
			old.push({module:this.selection[i],oldx:this.selection[i].p.x,oldy:this.selection[i].p.y});
		}
		x/=list.length;
		list.sort(function(a,b){return (a.y<b.y) ? -1 : 1;});
		var dy = (max-min)/(list.length-1);
		for(var j=0; j<list.length; j++) {
			this.selection[list[j].i].set_pos(x, min);
			old[j].newx = x;
			old[j].newy = min;
			min += dy;
		}
		
		this.add_command(new CommandAlign(old));
	};

	
	/////////////////
	// UNDO - REDO //
	/////////////////
	
	this.add_command = function(cmd) {
		if(!ISDEF(this.commands)) {this.commands = []; this.iCommand = 0;}
		this.commands = this.commands.slice(0,this.iCommand);
		this.commands.push(cmd);
		this.iCommand++;
	};
	
	this.undo = function() {
		if(!ISDEF(this.commands)) return;
		if(this.iCommand<1) return;
		this.iCommand--;
		this.commands[this.iCommand].undo();
	};
	
	this.redo = function() {
		if(!ISDEF(this.commands)) return;
		if(this.iCommand>=this.commands.length) return;
		this.commands[this.iCommand].redo();
		this.iCommand++;
	};
	
	
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
	};

	this.execute_statement_header = function(s) {
		if(s.startsWith("Script")) this.script.p.name = s.split(" ")[1].trim();
		else if(s.startsWith("Depends")) {this.script.p.depends.push(s.split(" ")[1].trim());}
	};

	this.execute_statement_modules = function(s) {
		if(!s.has("=")) this.cur_module = new Module(this, Math.random()*this.canvas.width(), Math.random()*this.canvas.height(), s.split(" ")[0].trim(), s.split(" ")[1].trim(), s.split(" ").slice(2));
		else {
			if(!this.cur_module) throw "Syntax error : "+s;
			var key = s.split("=")[0].trim();
			var val = s.split("=")[1].trim();
			if(key[0]=='@') key = key.substring(1,key.length); 
			this.cur_module.apply_property(key, val);
		}
	};

	this.execute_statement_links = function(s) {
		if(!s.has("=")) {
			var _src = s.substring(0, s.indexOf("-")).trim();
			var _dst = s.substring(s.indexOf(">")+1, s.length).trim();
			var type = s.substring(s.indexOf("-")+1, s.indexOf(">"));
			var src_pin = _src; 
			if(src_pin.has(".")) {src_pin = src_pin.substring(src_pin.indexOf(".")+1,src_pin.length); _src = _src.substring(0, _src.indexOf("."));}
			else src_pin = null;
			var dst_pin = _dst; 
			if(dst_pin.has(".")) {dst_pin = dst_pin.substring(dst_pin.indexOf(".")+1,dst_pin.length); _dst = _dst.substring(0, _dst.indexOf("."));}
			else dst_pin = null;
			var src = this.get_module_by_name(_src);
			var dst = this.get_module_by_name(_dst);
			if(!src) throw "No such module : " + _src;
			if(!dst) throw "No such module : " + _dst;
			this.cur_link = new Link(this, src, dst);
			if(src_pin) this.cur_link.p.src_pin = src_pin;
			if(dst_pin) this.cur_link.p.dst_pin = dst_pin;
			this.cur_link.p.type = type;
			this.cur_link.update();
		} else {
			if(!this.cur_link) throw "Syntax error : "+s;
			this.cur_link.apply_property(s.split("=")[0].trim(), s.split("=")[1].trim());
		}
	};
	
	this.write_model = function() {
		var s = "Script " + this.script.p.name + "\n";
		if(this.script.p.depends)
			for(var i = 0; i<this.script.p.depends.length; i++) s+="Depends "+ this.script.p.depends[i]+"\n";
		s+="\n";
		
		s+="[Modules]\n";
		for(var i =0;i<this.modules.length;i++) {
			s+= this.modules[i].p.type + " " + this.modules[i].p.name; 
			if(this.modules[i].p.targets && this.modules[i].p.targets.length) {
				s+= " " + (this.modules[i].p.bTargetModePositive ? "+" : "-") + this.modules[i].p.targets.join(" ");
			}
			s+= "\n";
			for(var key in this.modules[i].p) {
				if(!key.trim()) continue;
				if(key=="targets" || key=="bTargetModePositive") continue;
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
		return s;
	};
	
	
	this.save = function(filename) {
		var content = this.write_model();
		file_write(filename, content);
		this.set_modified(false);
		this.cur_file = filename;
		this.set_filename(filename);
	};
	
	
	
	this.get_id = function() {return this.id;};
	

	

	/////////////////
	// COMPILATION //
	/////////////////

	this.compile_model = function(_on_done) {
		cur_compilation_errors = " ";
		workbench.open_view("Errors");
		var on_done = _on_done;
		var _editor = this;
		var output = file_dirname(this.filename)+"/build_"+file_basename(this.filename);
		exec_async("pgcc "+this.filename + " "+output, function(err,stdout,stderr){
			if(stderr.length>0) alert(stderr);
			if(stdout.length>0) alert(stdout);
			else {
				DBG("CPP Code for " + _editor.filename + " successfully generated to " + output +" !!");
				exec_async("cd "+ output + ";make", function(err,stdout,stderr) {
					cur_compilation_errors = stderr;
					workbench.open_view("Errors");
					if(on_done) on_done();
				});
			}
		});
	};
	

	
	
	///////////////
	// EXECUTION //
	///////////////
	
	this.start_model = function() {
		cur_console = "";
		var _editor = this;
		this.compile_model(function() {
			workbench.open_view("Console");
			var output = file_dirname(_editor.filename)+"/build_"+file_basename(_editor.filename);
			exec_async("cd "+ output + "; gnome-terminal -x ./main", function(err, stdout, stderr) {
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



