


function Module(editor, x,y,type, name) {
	var canvas = editor.canvas;
	editor.modules.push(this);

	this.outs = [];
	this.ins = [];
	this.p = {x:x,y:y,name:name,type:type};
	
	this.elt = create_node(canvas, x,y,type,name);
	this.elt.model = this;
//	this.elt.decorate(10,-10,_SVG("circle").attr("r", 4).attr("fill","red"));
	
	
	this.add_out = function(link) { this.outs.push(link); };
	this.add_in = function(link) { this.ins.push(link); };
	
	this.on_move = function(x,y) {
		this.p.x = x;
		this.p.y = y;
		for(var i=0; i<this.outs.length; i++) this.outs[i].update();
		for(var i=0; i<this.ins.length; i++) this.ins[i].update();
		editor.set_modified(true);
	};
	
	this.on_mousedown = function(e){ 
		if(!this.is_selected() && !e.shiftKey) editor.unselect_all(); 
		this.select();	
	};
	
	this.on_mouseup = function(e) {	this.select();};
	
	this.on_click = function(e) {canvas.focus();};
	this.on_dblclick = function(e){DBG("DblClicked : " + this.toString());e.preventDefault(); e.stopPropagation();};
	
	this.update = function() {
		for(var i=0; i<this.outs.length; i++) this.outs[i].update();
		for(var i=0; i<this.ins.length; i++) this.ins[i].update();
	};
	
	this.getBBox = function() {
		var bb = this.elt.children()[0].getBBox();
		bb.x += this.p.x; bb.y += this.p.y;
		return bb;
	};
	
	this.is_in = function(x,y,w,h) {
		var bb = this.getBBox();
		return bb.x >= x && bb.y >= y && bb.x+bb.width <= x+w && bb.y+bb.height <= y+h;
	}
	
	this.is_selected = function() {return editor.selection.has(this);}
	
	this.select = function() {
		if(!this.is_selected()) {
			editor.add_selection(this);
			SVG_ADD_CLASS(this.elt, "selected");
		}		
		workbench.on_selection();
	};
	
	this.unselect = function() {
		editor.selection.remove(this);
		SVG_REMOVE_CLASS(this.elt, "selected");
	};
	
	this.remove = function() {
		this.unselect();
		while(this.outs.length>0) this.outs[0].remove();
		while(this.ins.length>0) this.ins[0].remove();
		this.elt.remove();
		editor.modules.remove(this);
	}
	
	this.set_pos = function(x,y) {this.elt.set_pos(x,y);}
	
	this.set_property = function(key,val) {
		if(key=="x") this.set_pos(parseFloat(val), this.p.y);
		else if(key=="y") this.set_pos(this.p.x,parseFloat(val));
		else if(key=="name") this.elt.set_text(this.p.name = val);
		else if(key=="type") this.elt.update_svg(this.p.type = val);
		else {
			if(!val) delete this.p[key];
			else this.p[key] = val;
		}
		editor.set_modified(true);
	};
	
	this.toString = function() { return "Node " + this.p.name; };
}


function Link(editor, src,dst) {
	this.editor = editor;
	var canvas = editor.canvas;
	editor.links.push(this);
	
	this.src = src;
	this.dst = dst;
	this.p = {
			type:"",
			src:src.p.name, dst:dst.p.name,
			src_pin:"", dst_pin:"",
			text:""
	};
	
	this.elt = create_link(canvas);
	this.end = create_link_end(canvas, this.elt);
	this.elt.model = this;
	this.end.model = this;
	
	this.src.add_out(this);
	this.dst.add_in(this);
	
	
	
	this.on_mousedown = function(e) {
		if(!e.shiftKey) editor.unselect_all();
		this.select();
	};
	this.on_mouseup = function(e) {	this.select(); };
	this.on_click = function(e) {	canvas.focus();	};
	this.on_dblclick = function(e) {DBG("DblClicked : " + this.toString());};
	
	this.update = function() {
		this.p.src = this.src.p.name;
		this.p.dst = this.dst.p.name;
		update_link(this.elt, this.end, this.src.getBBox(), this.dst.getBBox());
	};
	
	this.toString = function() {return this.p.src + "->" + this.p.dst;};
	
	this.on_mouseenter = function() {SVG_ADD_CLASS(this.end,"hover");};
	this.on_mouseleave = function() {SVG_REMOVE_CLASS(this.end,"hover");};
	
	this.select = function() {
		if(!editor.selection.has(this)) {
			editor.add_selection(this);
			SVG_ADD_CLASS(this.elt, "selected");
			SVG_ADD_CLASS(this.end, "selected");
		}
		workbench.on_selection();
	}
	
	this.unselect = function() {
		editor.selection.remove(this); 
		SVG_REMOVE_CLASS(this.elt, "selected");
		SVG_REMOVE_CLASS(this.end, "selected");
	}
	
	this.remove = function() {
		this.unselect();
		this.src.outs.remove(this);
		this.dst.ins.remove(this);
		this.elt.remove();
		this.end.remove();
		editor.links.remove(this);
	}
	
	
	this.set_property = function(key, val) {
		if(key=="src") {
			var m = editor.get_module_by_name(val);
			if(m) {	
				this.src.outs.remove(this);
				this.src = m; this.p.src = this.src.p.name;
				this.src.add_out(this);
			}
			else {alert("No such module : " + val);	}
		} else if(key=="dst") {
			var m = editor.get_module_by_name(val);
			if(m) {
				this.dst.ins.remove(this);
				this.dst = m; this.p.dst = this.dst.p.name;
				this.dst.add_in(this);
			} 
			else {alert("No such module : " + val);}
		}
		else {
			if(!val) delete this.p[key];
			else this.p[key] = val;
		}
		this.update();
		editor.set_modified(true);
	};
	
	this.update();

}


function Script(filename) {
	this.filename = filename;
	this.p = {name:file_basename(filename).replace("\\..*", ""), depends:[]};
	
	this.set_property = function(key, val) {
		if(!val) delete this.p[key];
		else this.p[key] = val;
		if(key=="depends") cur_editor.update_all_svg();
		this.update();
	};
	
	this.update = function() {
		cur_editor.set_modified(true);
	};
	
	this.resolve_dep_project = function(project) {
		var f = execSync("pgcc_resolve_project "+project);
		if(!f) throw "Can't resolve project " + project;
		return ""+f;
	};
	
	this.resolve = function(file) {
		for(var i=0; i<this.p.depends.length; i++) {
			var dep = this.p.depends[i];
			if(!file_exists(dep)) dep = this.resolve_dep_project(dep);
			var f = file_dirname(dep) + "/" + file;
			if(file_exists(f)) return f;
		}
		return null;
	};
}