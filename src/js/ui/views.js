
function view_create_properties() {
	var v2 = new View(null, "Properties");
	v2.update = function(e) {
		e.empty();
		if(cur_editor && cur_editor.has_selection()) {
			var o = cur_editor.selection[0];
			if(o.outs) {
				e.addClass("view_properties");
				
				e.append("<h3>Properties</h3>");
				var t = create_table_from_data({type:o.p.type,name:o.p.name,x:o.p.x,y:o.p.y},  function(key, val) { cur_editor.set_selection_property(key, val);});
				t.css("position", "relative");
				e.append(t);
				var b = $("<button class='browse_script'>...</button>");
				b.css("top",0);
				b.css("left", t.width()-20);
				b.click(function() {file_open_dialog(function(filename) { t.find("td:first-child:contains('type')").next().text("$"+filename); cur_editor.set_selection_property("type", "$"+filename);}, "*.script");});
				t.append(b);
				
				e.append("<h3>Params</h3>");
				e.append(create_table_from_data_plus(o.p, function(key, val) { cur_editor.set_selection_property(key, val);}, ["x", "y", "name", "type", "targets", "bTargetModePositive"]));
				
				var h = $("<h3>Targets<button class='on allow'>allow</button><button class='on deny'>deny</button></h3>");
				e.append(h);
				h.children("button").click(function() {
					if($(this).hasClass("on")) return;
					h.children("button").toggleClass("on");
					cur_editor.set_selection_property("bTargetModePositive", h.children("button.allow").hasClass("on"));
					if(o.p.bTargetModePositive) ul_targets.addClass("allow"); else ul_targets.removeClass("allow");
				});
				if(o.p.bTargetModePositive) h.children("button.deny").removeClass("on"); else h.children("button.allow").removeClass("on");
				
				var ul_targets = create_editable_list_editable(o.p.targets).change(function(data){ cur_editor.set_selection_property("targets", data);});
				ul_targets.addClass("targets");
				if(o.p.bTargetModePositive) ul_targets.addClass("allow");
				e.append(ul_targets);
			} else {
				e.append(create_table_from_data_plus(o.p, function(key, val) { cur_editor.set_selection_property(key, val);}));
			}
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
	};
}
var cur_compilation_errors = "";



function view_create_console() {
	var v = new View(null, "Console");
	v.update = function(e) {
		e.empty();
		e.addClass("view_console");
		e.html(cur_console);
	};
}
var cur_console = "";



function view_create_script() {
	var v = new View(null, "Script");
	v.update = function(e) {
		e.empty();
		if(!cur_editor) return;
		e.addClass("view_script");
		e.append("<h3>Properties</h3>");
		e.append(create_table_from_data(cur_editor.script.p, function(key, val) { cur_editor.script.set_property(key, val);}, ["depends"]));
		
		e.append("<h3>Depends</h3>");
		var dep = create_editable_list(pgcc_get_projects(), cur_editor.script.p.depends);
		dep.change(function(){
			cur_editor.script.set_property("depends", dep.get_selected_items());	
		});
		e.append(dep);
	};
}


function view_create_create() {
	var v = new View(null, "Create");
	v.update = function(e) {
		if(!cur_editor) return;
		if(cur_editor.bDontUpdateDeps) return;
		e.empty();
		e.addClass("view_create");
		var list = $("<ul></ul>");
		e.append(list);
		
		list.declare_module = function(project, module, decl) {
			var li = $("<li><b>"+module+"</b><p>(in "+project+")</p><pre>"+decl+"</pre></li>");
			li.click(function() {workbench.start_creator(new ModuleCreator(module));});
			list.append(li);
		};
		
		list.add_module = function(project, module) {
			exec_async("pgcc_module " + project + " " + module, function(err,stdout,stderr){
				list.declare_module(project, module, stdout.toString());
			});
		};
		
		list.add_project = function(project) {
			exec_async("pgcc_project_modules " + project, function(err,stdout,stderr){
				var modules = stdout.toString().split("\n");
				for(var j = 0; j<modules.length; j++) {
					if(modules[j].trim()) list.add_module(project, modules[j]);
				}
			});
		};
		
		list.declare_module("core", "FOR");
		list.declare_module("core", "ENDFOR");
		list.declare_module("core", "In");
		list.declare_module("core", "Out");
		
		var projects = cur_editor.script.p.depends;
		for(var i = 0; i<projects.length; i++) list.add_project(projects[i]);
		
		cur_editor.bDontUpdateDeps = true;
	};
}