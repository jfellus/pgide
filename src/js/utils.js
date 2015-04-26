//////////////
// INCLUDES //
//////////////

var ngui = require('nw.gui');
var nwin = ngui.Window.get();
var sys = require('sys');
var exec_async = require('child_process').exec;
var fs = require('fs');
var path = require('path');


////////////
// STRING //
////////////

String.prototype.replaceAll = function (find, replace) {
	var str = this;
	return str.replace(new RegExp(find, 'g'), replace);
};	

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.has != 'function') {
	String.prototype.has = function (str){
		return this.indexOf(str) !== -1;
	};
}

Array.prototype.remove = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}

Array.prototype.has = function(val) {
	return this.indexOf(val)!==-1;
}

$(function(){
	$.extend($.fn.disableTextSelect = function() {
	return this.each(function(){$(this).mousedown(function(e){
		if(!document.edragged && e.button==0) return false;
	});});
});});


function file_basename(f) {
	return f.indexOf("/")!==-1 ? f.substring(f.lastIndexOf("/")+1, f.length) : f;
}

function file_dirname(f) {
	return f.indexOf("/")!==-1 ? f.substring(0, f.lastIndexOf("/")) : '.';
}

///////////
// DEBUG //
///////////

var dbg_elt = null;
$(function() { dbg_elt = $("body");});
function DBG(x) {
	if(dbg_elt) dbg_elt.html("<div>"+x+"</div>");
}


////////
// IO //
////////

function file_read(f, callback) {
	return exec_async("cat " + f, callback);
}

function file_write(f, str) {
	return exec_async("echo '"+ str + "' > " + f);
}

function file_read_array(f, callback) {
	return file_read(f, function(err,stdout,stderr){
		if(stderr.length) alert(stderr);
		callback(stdout.split("\n"));
	});
}

function file_write_array(f, a) {
	file_write(f, a.join("\n"));
}

function touch(f) {
	fs.closeSync(fs.openSync(f, 'a'));
}

function file_change_ext(f, ext) {
	return f.substr(0, f.lastIndexOf(".")) + ext;
}

function list_dir(dir, callback) {
	exec_async("find "+dir+" -maxdepth 1 -type f", function(error, stdout, stderr){
		callback(stdout.split("\n"));
	});
}

function list_dir_filter(dir, filter, callback) {
	exec_async("find "+dir+" -name '"+filter+"' -maxdepth 1 -type f", function(error, stdout, stderr){
		callback(stdout.split("\n"));
	});
}


function file_open_dialog(callback) {
	var e = $("<input type='file' style='display:none' />"); $("body").append(e);
	e.change(function(){callback(e.val());e.remove();});
	e.click();
}


//////////
// LIST //
//////////

function list_append_array(list, a) {
	var ul = list;
	for(var i = 0; i<a.length; i++) {
		if(a[i].trim().length) ul.append("<li>"+a[i]+"</li>");
	}
}


function get_list_array(list) {
	var a = [];
	var ul = $(list).children("ul");
	ul.children().each(function() { 
		if($(this).text().trim()) a.push($(this).text().trim());
	});
	return a;
}

function link_list_to_file(list, file, callback) {
	var l = $(list);

	function update() {
		var a = [];
		$(list).children("ul").children().each(function() {a.push($(this).text())});
		file_write_array(file, a);	
		callback();
	}

	exec_async("mkdir -p ~/.agml/; touch " + file, function() {
		file_read_array(file, function(a) {
			var ul = $(list).children("ul")
			ul.empty();
			for(var i = 0; i<a.length; i++) {
				if(a[i].trim().length) ul.append("<li>"+a[i]+"</li>");
			}
			callback();
		});
	});


	var _d = null;
	l.keyup(function() {
		if(_d) clearTimeout(_d);
		_d = setTimeout(update, 1000);
	});
}

$(function() {
	$(".list > div:first-child").click(function() {
		$(this).parent().children(".content").slideToggle();
	});
});



/////////////////////
// CODE GENERATION //
/////////////////////

function _SVG(elt_name) {return $(document.createElementNS('http://www.w3.org/2000/svg',elt_name));}
function SVG_ADD_CLASS(e, cls) { e.attr("class", e.attr("class")+" "+cls); return e;}
function SVG_REMOVE_CLASS(e, cls) { e.attr("class", e.attr("class").replaceAll(cls, "")); return e;}

function set_singlelined(elt) {
	elt.keydown(function(e) {if(e.which==13) { $(this).change(); e.preventDefault(); e.stopPropagation(); }});
	elt.keyup(function(e) {if(e.which==13) { e.preventDefault(); e.stopPropagation(); }});
	elt.keypress(function(e) {if(e.which==13) { e.preventDefault(); e.stopPropagation(); }});
}

function create_table_from_data(data, callback_edit, filter) {
	var t = $("<table class='props'></table>");
	for(var i in data) {
		if(filter && filter.has(i)) continue;
		var tr = $("<tr/>");
		tr.append("<td class='key'>"+i+"</td>");
		var td = $("<td class='val' key='"+i+"' contentEditable=true>"+data[i]+"</td>");
		set_singlelined(td);
		if(callback_edit) td.change(function() {callback_edit($(this).attr("key"), $(this).text());});
		tr.append(td);
		t.append(tr);
	}
	return t;
}

function create_table(rows, cols) {
	var t = $("<table></table>");
	for(var i = 0; i<rows; i++) {
		var tr = $("<tr></tr>");
		t.append(tr);
		for(var j=0;j<cols;j++) {tr.append("<td></td>");}
	}
	return t;
}

function create_divider() {
	var t = create_table(1,3);
	t.addClass("divider");
	var v = t.find("td").eq(0).append("<div></div>");
	t.left = v.children("div"); 
	t.sep = t.find("td").eq(1);
	t.sep.addClass("sep");
	var v = t.find("td").eq(2).append("<div></div>");
	t.right = v.children("div");
	
	t.setLocation = function(l) {
		this.left.parent().css("width", (l*100)+"%");
	};
	t.sep.mousedown(function() {document.edragged = t;});
	t.dragg = function(dx,dy) { 
		t.left.parent().css("width", t.left.parent().width() + dx);
		t.left.css("width", t.left.width() + dx);
		t.left.css("overflow", "auto");
//		t.left.children().eq(0).css("width", t.left.children().eq(0).width() + dx);
		$(window).resize();
	};
	return t;
}

function create_window() {
	var t = create_table(4,1);
	t.addClass("window");
	var v = t.find("td").eq(0).addClass("h menubar").append("<ul></ul>");
	t.menubar = v.children("ul");
	v.focus(function () {$(this).blur();});
	t.menubar.focus(function () {$(this).blur();});
	var v = t.find("td").eq(1).addClass("h toolbar").append("<ul></ul>");
	t.toolbar = v.children("ul");
	t.toolbar.focus(function () {$(this).blur();});
	v.focus(function () {$(this).blur();});
	t.main = t.find("td").eq(2).addClass("main");
	t.status = t.find("td").eq(3).addClass("status");
	return t;
}

function create_tabbed_pane() {
	var t = create_table(2,1);
	t.ids = [];
	t.closeListeners = [];
	t.addClass("tabbed_pane");
	var v = t.find("td").eq(0).addClass("h header").append("<ul></ul>");
	t.header = v.children("ul");
	t.header.focus(function () {$(this).blur();});
	t.body = t.find("td").eq(1).addClass("body");
	t.body.focus(function () {$(this).blur();});
	t.has = function(id) {return this.ids.has(id);}
	t.add = function(id, icon_cls, title, body, update_callback) {
		if(this.has(id)) return this.open(id);
		this.ids.push(id);
		var li = $("<li class='"+id+"'></li>");
		if(icon_cls) li.append("<span class='icon "+icon_cls+"'></span>");
		li.append("<span class='title'>"+title+"</span>");
		li.append("<a class='close'></a>");
		this.header.append(li);
		var b = $("<div class='"+id+"' style='display:none'></div>");
		b.append(body);
		this.body.append(b);
		
		var t = this;
		li.click(function() {
			var id = $(this).attr("class").split(" ")[0];
			t.header.children("li").removeClass("selected"); li.addClass("selected");
			t.body.children("div").removeClass("selected").hide();  
			t.body.children("div."+id).addClass("selected").show();
			update_callback(t.body.children("div."+id));
		});	
		li.children("a.close").click(function() {t.close(li.attr("class").split(" ")[0]);});
	};
	t.get_body = function(title) { return t.body.children("div."+title); };
	t.open = function(id) {
		var li = t.header.children("li."+id);
		if(!li) throw "Can't find view '"+id+"'";
		li.click();
	};
	t.close = function(id) {
		if(typeof id === "function") t.closeListeners.push(id);
		else {
			var ok = true;
			for(var i = 0; i<t.closeListeners.length; i++) if(!t.closeListeners[i](id)) { ok = false; break;}
			if(!ok) return; 
			t.header.children("li."+id).remove();
			t.body.children("div."+id).remove();
			t.ids.remove(id);
			if(t.ids.length>0) t.open(t.ids[t.ids.length-1]);
		}
	};
	t.set_title = function(id, title) {
		var li = t.header.children("li."+id);
		if(!li) throw "Can't find view '"+id+"'";
		li.children(".title").html(title);
	};
	t.change_id = function(old_id, new_id) {
		var li = t.header.children("li."+old_id);
		li.removeClass(old_id); li.addClass(new_id);
		var body = t.body.children("div."+old_id);
		body.removeClass(old_id); body.addClass(new_id);
		t.ids.remove(old_id); t.ids.push(new_id);
	}
	t.focus(function () {$(this).blur();});
	return t;
}


function create_canvas() {
	var canvas = _SVG("svg");
	canvas.x = 0; canvas.y = 0;
	canvas.offsetx = 0; canvas.offsety = 0; canvas._zoom = 1;
	
	canvas.maingroup = _SVG("g");
	canvas.maingroup.attr("transform", "translate("+canvas.offsetx+","+canvas.offsety+")");
	canvas.append(canvas.maingroup);
	
	canvas.move = function(dx,dy) {
		canvas.offsetx += dx; canvas.offsety += dy;
		canvas.update_view();
	};
	canvas.zoom = function(cx, cy, dzoom) {
		cx =  (cx - canvas.offsetx)/ canvas._zoom;
		cy =  (cy - canvas.offsety)/ canvas._zoom;
		var oldzoom = canvas._zoom;
		canvas._zoom *= 1 + dzoom;
		canvas.offsetx -= cx*(canvas._zoom - oldzoom);
		canvas.offsety -= cy*(canvas._zoom - oldzoom);
		canvas.update_view();
	}
	canvas.relX = function(x) {return (x-canvas.offsetx)/canvas._zoom;};
	canvas.relY = function(y) {return (y-canvas.offsety)/canvas._zoom;};
	canvas.update_view = function() {
		canvas.maingroup.attr("transform", "translate("+(canvas.offsetx)+","+(canvas.offsety)+") scale("+canvas._zoom+")");
		$("#markerArrow").children().attr("transform", "translate(0,7) scale("+(1.0/canvas._zoom)+") translate(0,-7)");
	}
	canvas.update = function() {
		cur_canvas = this;
		this.update_view();
		var p = this.parent();
		this.detach();
		var w = p.width();
		var h = p.height();
		this.attr("width", w);
		this.attr("height", h);
		p.append(this);
		if(this.on_update) this.on_update();
	};
	
	
	canvas.x = 0; canvas.y = 0;
	canvas.mousemove(function(e) {
		if(document.btn==1) canvas.move(e.pageX-canvas.x, e.pageY-canvas.y);
		canvas.x = e.pageX;
		canvas.y = e.pageY;
	});
	canvas.on('mousewheel', function(e) {
		canvas.zoom(e.offsetX, e.offsetY, e.originalEvent.wheelDelta*0.001);
		e.preventDefault();
        e.stopPropagation();
	});
	canvas.click(function(e) {if(!canvas._is_sel) canvas.unselect_all(); canvas._is_sel=false; canvas.blur();});
	canvas.unselect_all = function() {cur_editor.unselect_all();};
	canvas.focus = function() {canvas.parent().focus();}
	canvas.blur = function() {canvas.end_edit_text();};
	
//	create_markers(canvas);
	

	return canvas;
}


function on_text_keydown(e) {
	var text = cur_canvas.cur_edited_text.html();
	if (e.which == 8) { // Backspace
		e.preventDefault();
		text = text.substring(0,text.length-1);
		cur_canvas.cur_edited_text.html(text);
		cur_canvas.cur_edited_text.on_change();
	};
	if (e.which == 13) { cur_canvas.blur(); };
}

function on_text_keypress(e) {
	var text = cur_canvas.cur_edited_text.html();
	text = text+String.fromCharCode(e.which);
	cur_canvas.cur_edited_text.html(text);
	cur_canvas.cur_edited_text.on_change();
}
	


$(function() {
	$(window).mousedown(function(e) { 
		document.btn = e.button; 
		if(e.button==0 && document.edragged) return false; 
//		if(e.button==0 && !$(e.target).attr("contentEditable")) return false;
	});
	$(window).mousemove(function(e) { if(document.edragged && typeof(document.lastX)!="undefined" && document.btn==0) document.edragged.dragg(e.pageX-document.lastX, e.pageY-document.lastY); document.lastX = e.pageX; document.lastY = e.pageY; });
	$(window).mouseup(function(e) { document.btn = -1; document.edragged = null;});
});