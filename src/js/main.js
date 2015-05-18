var gui = require('nw.gui');

/////////////
// GLOBALS //
/////////////

var workbench = null;



function main(){
	try {
		workbench = new Workbench();
		
		var f = null;
		for(var i=0;i<gui.App.argv.length;i++) if(gui.App.argv[i][0]!='-') f = gui.App.argv[i]; 
		if(f) workbench.open(f);
		
	//	workbench.open("/home/jfellus/Bureau/ptcg.script");
		
		workbench.open_view("plot");
		
	} catch(err) {alert(err.stack ? err.stack : err);}
}