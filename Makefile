all: bin/pgide.nw


bin:
	mkdir -p bin
	
bin/pgide.nw: bin src/css/* src/html/* src/js/* src/package.json
	cd src; zip -r ../bin/pgide.nw .
