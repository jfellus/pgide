

/////////////
// GLOBALS //
/////////////

var workbench = null;



function main(){
	try {
		create_workbench();
		

		
		workbench.open("/home/jfellus/workspace/pg/demo/basic_vision.script.bak");
			
		
	} catch(err) {alert(err.stack ? err.stack : err);}
}