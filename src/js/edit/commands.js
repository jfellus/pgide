function CommandSetProperty(old) {
	if(old.what) {
		this.undo = function() {
			old.what.apply_property(old.key, old.oldval);
			if(old.what.resolve) workbench.open_view("Script");
			else workbench.open_view("Properties");
		};
		this.redo = function() {
			old.what.apply_property(old.key, old.newval);
			if(old.what.resolve) workbench.open_view("Script");
			else workbench.open_view("Properties");
		};
	} else {
		this.undo = function() {
			for(var i = 0; i<old.length; i++) {
				old[i].what.apply_property(old[i].key, old[i].oldval);
			}
			workbench.open_view("Properties");
		};
		this.redo = function() {
			for(var i = 0; i<old.length; i++) {
				old[i].what.apply_property(old[i].key, old[i].newval);
			}
			workbench.open_view("Properties");
		};
	}
}

function CommandDelete(sel) {
	this.undo = function() {
		for(var i = 0; i<sel.length; i++) sel[i].reattach();
		cur_editor.unselect_all();
		for(var i = 0; i<sel.length; i++) sel[i].select(); 
	};
	
	this.redo = function() {
		for(var i = 0; i<sel.length; i++) sel[i].detach();
		cur_editor.unselect_all();
	};
}

function CommandCreateModule(m) {
	this.undo = function() {
		cur_editor.unselect_all();
		m.detach();
	};
	this.redo = function() {
		cur_editor.unselect_all();
		m.reattach();
		m.select();
	};
}

function CommandCreateLink(l) {
	this.undo = function() {
		cur_editor.unselect_all();
		l.detach();
	};
	this.redo = function() {
		cur_editor.unselect_all();
		l.reattach();
		l.select();
	};
}

function CommandAlign(old) {
	this.undo = function() {
		for(var i = 0; i<old.length; i++) {
			old[i].module.set_pos(old[i].oldx, old[i].oldy);
		}
	};
	this.redo = function() {
		for(var i = 0; i<old.length; i++) {
			old[i].module.set_pos(old[i].newx, old[i].newy);
		}
	};
}


