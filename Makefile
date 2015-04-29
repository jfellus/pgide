all: bin/pgide.nw


bin:
	mkdir -p bin
	
bin/pgide.nw: bin src/css/* src/html/* src/js/* src/package.json
	cd src; zip -r ../bin/pgide.nw .

	
install: bin/pgide.nw
	sudo rm -f /usr/local/bin/pgide
	sudo ln -s `pwd`/pgide /usr/local/bin/pgide