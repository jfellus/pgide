

/////////////
// GLOBALS //
/////////////

var workbench = null;



function main(){
	try {
		create_workbench();
		

		
		workbench.open("/home/jfellus/Bureau/ptcg.script");
			
		
	} catch(err) {alert(err.stack ? err.stack : err);}
}