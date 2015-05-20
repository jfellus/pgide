function pgcc_get_projects() {
	return execSync("pgcc_projects -l").toString().trim().split("\n");
}