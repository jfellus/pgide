all: bin/pgide.nw


bin:
	mkdir -p bin
	
bin/pgide.nw: bin src/css/* src/html/* src/js/* src/js/utils/* src/js/ui/* src/js/edit/* src/js/lib/* src/package.json
	cd src; zip -r ../bin/pgide.nw .

	
install: bin/pgide.nw
	@sudo rm -f /usr/local/bin/pgide
	@ln -s `pwd`/pgide /usr/local/bin/pgide
	@cp resources/pgide.desktop /usr/share/applications/
	@chmod a+wrx /usr/share/applications/pgide.desktop
	@cp resources/mime*.xml /usr/share/mime/packages/
	@cp resources/pgide-48x48.png /usr/share/icons/hicolor/48x48/apps/
	@update-mime-database /usr/share/mime