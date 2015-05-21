function ModuleCreator(type) {
	this.x = 0;
	this.y = 0;
	this.elt = null;
	this.type = "?";
	
	if(ISDEF(type)) {
		this.type = type;
		this.name  = this.type.toLowerCase();
	}
	else this.name = "new_module";
	
	for(var i=1; cur_editor.get_module_by_name(this.name); i++) this.name = this.type=="?" ? "new_module_"+i : this.type.toLowerCase()+"_"+i;
	
	this.start = function() {
	};
	
	this.create = function() {
		var m = new Module(cur_editor, this.x, this.y, this.type, this.name);
		cur_editor.add_command(new CommandCreateModule(m));
		m.select();
		cur_editor.set_modified(true);
		this.end();
	};
	
	this.move = function(x,y) {
		if(!this.elt) {
			this.elt = create_node(cur_canvas, x,y,this.name);
			cur_canvas.maingroup.append(this.elt);
		}
		
		this.x = x;
		this.y = y;
		this.elt.attr("transform", "translate(" +x+","+y+")");
	};
	
	this.end = function() {
		if(this.elt) this.elt.remove();
		workbench.end_creator();
	};
}

function LinkCreator() {
	this.src = null;
	this.dst = null;
	this.link = null;
	this.link_end = null;
	this.elt = null;
	
	this.start = function() {
		this.elt = _SVG("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill","red");
		cur_canvas.maingroup.prepend(this.elt);
	};
	
	this.move = function(x,y) {
		this.x = x;
		this.y = y;
		if(this.elt) {
			this.elt.attr("transform", "translate("+x+","+y+")");
		}
		if(this.src) {
			var r = {x:x,y:y,width:0,height:0};
			update_link(this.link,this.link_end,this.src.getBBox(), r);
		}
	};
	
	this.create = function() {
		if(!this.link) {
			this.link = create_link(cur_canvas);
			this.link_end = create_link_end(cur_canvas, this.elt);
		}
		
		if(!this.src) {
			this.src = cur_editor.get_selected_module();
			if(this.src) {this.elt.remove(); this.elt = null;}
		}
		else {
			this.dst = cur_editor.get_selected_module();
			if(this.dst) {
				var l = new Link(cur_editor, this.src, this.dst);
				l.update();
				cur_editor.add_command(new CommandCreateLink(l));
				l.select();
				cur_editor.set_modified(true);
				this.end();
			}
		}
	};
	
	this.end = function() {
		if(this.link) this.link.remove();
		if(this.link_end) this.link_end.remove();
		if(this.elt) this.elt.remove();
		workbench.end_creator();
	};
}