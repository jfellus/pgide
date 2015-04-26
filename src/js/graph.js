var canvas = null;





function create_node(canvas, x, y, text) {
	var t = _SVG("text").attr("x", 0).attr("y", 20).attr("text-anchor", "middle").html(text);
	t.dblclick(function(e) { canvas.start_edit_text(t);});
	t.on_change = function() {
		if(node.model) { node.model.set_property("name", t.html());node.model.select();}
	};
	var node = _SVG("g").attr("transform", "translate(" + x + ","+ y + ")").attr("x", x).attr("y", y).attr("id", "node_"+text).attr("class", "node")
	.append(_SVG("circle").attr("cx", 0).attr("cy", 0).attr("r", 10).attr("stroke", "green").attr("stroke-width", 1).attr("fill","yellow"))
	.append(t)
	.mousedown(function(e) { if(node.model) {node.model.on_mousedown(e);document.edragged = node;}})
	.mouseup(function(e) { if(node.model) node.model.on_mouseup(e); })
	.click(function(e) { if(node.model) {node.model.on_click(e);canvas._is_sel=true;e.preventDefault();}})
	.dblclick(function(e) {if(node.model) {node.model.on_dblclick(e);e.preventDefault();e.stopPropagation();}});
	
	node.dragg = function(dx,dy) {
		var x = parseFloat(node.attr("x"));
		var y = parseFloat(node.attr("y"));
		x += dx/canvas._zoom; y += dy/canvas._zoom;
		node.set_pos(x,y);
	};
	
	node.set_pos = function(x,y) {
		this.attr("x", x).attr("y", y);
		this.attr("transform", "translate(" + x + ","+ y + ")");
		if(this.model) this.model.on_move(x,y);
	};
	
	node.set_text = function(text) {
		this.children("text").html(text);
		if(this.model) this.model.update();
	}
	
	node.decorations = [];
	node.decorate = function(x,y,elt) {
		elt.attr("transform", "translate("+x+","+y+")");
		node.decorations.push(elt);
		node.append(elt);
	};
	
	canvas.maingroup.append(node);
	return node;
}


function create_link(canvas) {
	var link = _SVG("path")
		.attr("class", "link")
		.attr("vector-effect","non-scaling-stroke")
		.click(function(e) {if(link.model) {link.model.on_click(e);canvas._is_sel=true;e.preventDefault();}})
		.dblclick(function(e) {if(link.model) {link.model.on_dblclick(e);e.preventDefault();e.stopPropagation();}})
		.mousedown(function(e) { if(link.model) {link.model.on_mousedown(e);}})
		.mouseup(function(e) { if(link.model) {link.model.on_mouseup(e);}})
		.mouseenter(function() {SVG_ADD_CLASS(link, "hover"); if(link.model) {link.model.on_mouseenter();}})
		.mouseleave(function() {SVG_REMOVE_CLASS(link, "hover"); if(link.model) {link.model.on_mouseleave();}});
	canvas.maingroup.prepend(link);
	return link;
}

function create_link_end(canvas, link) {
	var end = _SVG("path").attr("class", "end").attr("d", "M 0,0 L -10,-5 -10,5 Z");
	canvas.maingroup.prepend(end);
	return end;
}


	
function update_link(link, end, bba, bbb) {
	var sx = bba.x+bba.width/2;
	var sy = bba.y+bba.height/2;
	var dx = bbb.x+bbb.width/2;
	var dy = bbb.y+bbb.height/2;
	
	var di = compute_line_circle_intersection(dx,dy,bbb.width/2, sx, sy);
	var angle = Math.atan((di.y-sy)/(di.x-sx))/6.28*360;
	if(di.x < sx) angle=angle+180;
	
	link.attr("d", "M "+sx+","+sy+" C "+((sx+di.x)/2)+","+((sy+di.y)/2)+" "+((sx+di.x)/2)+","+((sy+di.y)/2)+" "+di.x+","+di.y);
	end.attr("transform", "translate("+di.x+","+di.y+") rotate("+angle+")");
}






