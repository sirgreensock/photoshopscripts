// New Export Layers to PDF Presentation
// Nikola Odic 2018
//
// Grabs groups and layers to generate a PDF Presentation
// Can create separate files from groups or one file from whole thing

#target Photoshop

// GLOBAL VARIABLES
var doc; //Active Document reference

app.playbackDisplayDialogs = DialogModes.ALL; //display all dialog menus

//Setting up default PDF Settings
var presentationOptions = new PresentationOptions();

            presentationOptions.presentation = false;

            presentationOptions.view = false;

            presentationOptions.autoAdvance = false;


var savePath = new Folder("~/Desktop").fsName; //save location
var pathText; //user override for save location

//define default save options
var pngOpts = new PNGSaveOptions;
pngOpts.compression = 0;
pngOpts.interlaced = false;

var layerArray = []; //array of all layers in the document

var groupArray = []; //array of all the groups in the document

var exportOption = "groups"; //Setting to either save groups as individual files ("groups") or whole file as single pdf ("single")

var filenameOption = "groups"; //Setting to name PDFs based on group names ("groups") or have a filename override ("override")
var filename;

main();

//Check if a document is open, open initial dialog window
function main(){
	if (app.documents.length <= 0) {
		alert( "Error: A Document must be opened!" );
		return 'cancel';	
	} else {

		//setting references to open document
		doc = app.activeDocument;
		filename = doc.name;

		sortLayers(doc, layerArray, groupArray); // Start by grabbing all layers and groups		
		startDialog();
	}
}

//Dialog window with destination and file options
function startDialog(){
	var saveDialog = new Window('dialog',"Export Layers To PDF");
	saveDialog.orientation = 'column';
	saveDialog.notification = saveDialog.add('statictext {justify: "center"}');
	saveDialog.notification.graphics.font = "Tahoma-Bold:16";
	saveDialog.notification.text = "Found " + layerArray.length + " layers and " + groupArray.length + " groups." ;
	saveDialog.alignChildren = "fill";
	
	//creating dropdown to select export type (group or single)
	var exportTypeGroup = saveDialog.add('panel');
	exportTypeGroup.add("statictext",undefined,"Select Export Format:");
	var exportTypeDropdown = exportTypeGroup.add("dropdownlist",undefined,["Export groups as separate PDF files", "Export all layers as single PDF"]);
	exportTypeDropdown.selection = 0;	

	exportTypeDropdown.onChange = function() {

		if (groupArray.length > 1 ) {
			formatPanel.group3.filenameGroup.suffix.text = "-1";
		} else {
			formatPanel.group3.filenameGroup.suffix.text = "";
		}

		if (exportTypeDropdown.selection == 0) {
			//Groups to PDF
			exportOption = "groups";
		} else {
			//Whole file to PDF
			exportOption = "single";
		}
	}

	//Settings for save destination
	var pathGroup = saveDialog.add('panel');

     //Check if the document has previously been saved, if yes the default save location is the same as the document path
    try {
        var docPath = activeDocument.path;
        savePath = doc.path.fsName; //Converts document path to human readable path
        }
    catch (e) {
            $.write("Document is not saved, defaulting to Desktop!");
        }
    
	pathGroup.add("statictext",undefined,"Destination:");
	pathText = pathGroup.add("edittext",undefined, savePath);
	pathText.characters = 30;
	var browseBtn = pathGroup.add("button",undefined,"Browse");

	var formatPanel = saveDialog.add('panel');
	formatPanel.alignment = 'fill';


	//Creating dropdown to select how to handle filenames (automatic or manual)
	formatPanel.group = formatPanel.add('group');
	formatPanel.group.orientation = "column";
	formatPanel.group.add("statictext", undefined, "Select Filename Preference:");
	var formatTypeDropdown = formatPanel.group.add("dropdownlist",undefined,["Automatic - Based on document and group names", "Manual - Specify filename"]);
	formatTypeDropdown.characters = 25;
	formatTypeDropdown.selection = 0

	formatPanel.group3 = formatPanel.add('group');	
	formatPanel.group3.orientation = "column";
	formatPanel.group3.test = formatPanel.group3.add("statictext",undefined,"Set filename:");
	formatPanel.group3.filenameGroup = formatPanel.group3.add('group');
	formatPanel.group3.filenameGroup.orientation = "row";

	var filenameInput = formatPanel.group3.filenameGroup.add("edittext");
	filenameInput.characters = 25;
	filenameInput.text = filename;

	formatPanel.group3.filenameGroup.suffix = formatPanel.group3.filenameGroup.add("statictext");
	formatPanel.group3.filenameGroup.format = formatPanel.group3.filenameGroup.add("statictext", undefined, ".pdf");

	if (groupArray.length > 1 ) {
		formatPanel.group3.filenameGroup.suffix.text = "-1";
	} else {
		formatPanel.group3.filenameGroup.suffix.text = "";
	}

	formatPanel.group3.visible = false;

	formatTypeDropdown.onChange = function() {
		if (groupArray.length > 1 ) {
			formatPanel.group3.filenameGroup.suffix.text = "-1";
		} else {
			formatPanel.group3.filenameGroup.suffix.text = "";
		}

		if (formatTypeDropdown.selection == 0) {
			//Automatic is selected
			formatPanel.group3.visible = false;
			filenameOption = "groups";


		} else {
			//manual is selected
			formatPanel.group3.visible = true;
			filenameOption = "override";
		}
	}

	

	var buttonGroup = saveDialog.add('group');
	buttonGroup.orientation = "row";
	buttonGroup.alignment = "center";
	var startBtn = buttonGroup.add('button',undefined,"Start");
	var cancelBtn = buttonGroup.add("button",undefined,"Cancel",{name:"cancel"});

	//Button to select new destination folder, check if its valid
	browseBtn.onClick = function() {
		var newSavePath = Folder.selectDialog("Select Save Destination");
		if (newSavePath != null) {
			savePath = newSavePath.fsName;
			pathText.text = savePath;
		}
	}

	//Button to start exporting after checking that the folder is still valid
	startBtn.onClick = function() {

		//check if the specified destination is valid
		var checkPathText = new Folder(pathText.text);		
		if (!checkPathText.exists) {
			//File path is invalid, cancel script
			alert("Invalid Save Destination!");
			saveDialog.close();	
			return 'cancel'
		} else {
			//File path is valid, starting script

			if (filenameOption == "override") {
				filename = filenameInput.text + formatPanel.group3.filenameGroup.suffix.text;
			}

			savePath = checkPathText.fsName;						
			saveDialog.close();

			//Sets the correct process based on export setting
			if (exportOption == "groups") {
				processGroups(filenameOption);
			} else {
				processFiles(layerArray,filename);
			}

			alert("Finished!");

		}		
	}

	saveDialog.show(); 
}

//goes through all layers in parent, if an art layer is encountered it pushes to array,
//if a group is encountered it repeats the script and sends the group into a separate array
function sortLayers (parent,layerArray,groupArray){
    for (var i = 0; i < parent.layers.length; i++){
        var theLayer = parent.layers[i];

        //Looks for art layers, ignores background layer and non-Normal type layers (ignores text, shape etc layers)
        if (theLayer.typename === "ArtLayer" && theLayer.isBackgroundLayer != true && theLayer.kind == LayerKind.NORMAL){
        	
        	 layerArray.push(theLayer)
        	   		
   					 			
        } else if (theLayer.typename === "LayerSet"){

        	//double check the group isnt empty before pushing it
        	if (theLayer.layers.length > 0){
        		groupArray.push(theLayer)
        	};            
            //if a group is encountered search layers in group
            sortLayers(theLayer, layerArray, groupArray);        	
        	   		            
        } else {
        	continue;
    		};
    }
}

//Goes through each group, collects children into array, sets filename, sends to process
function processGroups(){
	for (var i = 0; i < groupArray.length; i++) {
		var pdfName = groupArray[i].name;
		var groupFiles = [];

		getChildren(groupArray[i], groupFiles);

		//Double check if group is empty
		if (groupFiles <= 0) {
			continue;
		} 

		//Checks if its in manual mode or override, sets name
		if (!filenameOption == "override") {
			pdfName = filename;
		} 

		processFiles(groupFiles, pdfName);
		continue;
	}
}

//Gets all Normal Art Layer children, sends to array
function getChildren(groupName,arrayName) {
	for (var i = 0; i < groupName.layers.length; i++) {
		var theLayer = groupName.layers[i];

        //Looks for art layers, ignores background layer and non-Normal type layers (ignores text, shape etc layers)
        if (theLayer.typename === "ArtLayer" && theLayer.isBackgroundLayer != true && theLayer.kind == LayerKind.NORMAL){
        	
        	 arrayName.push(theLayer)        	   		
   					 			
        } else {
        	continue;
    		};
	}
}

//Takes files and export filename and processes into PDF
function processFiles(files,exportName){

	//array to hold all files to be added to PDF
	var docList = new Array();

	//temporary folder to store files until they are added to PDF
	var tempFolder = new Folder(savePath + "/" + "_temp_ExportLayersToPDF");
	if (!tempFolder.exists) {

            tempFolder.create();          

        }

    //Removed spaces from filename so the exporter functions
    var cleanExportName = exportName.replace(/\s/g , "_");

    //Sets exporter path and filename
	var pdfName = new File(savePath + "/" + cleanExportName + ".pdf");

	//Isolates and saves each layer into temp folder, pushes to array
	for (var i = 0; i < files.length; i++) {
		
		var startName = files[i].name;
		var cleanName = startName.replace(/\s/g , "_");


		var newFile = File.encode(tempFolder + "/" + cleanName + ".png");
		var newPage = new File(newFile);

		//Makes sure the saved files arent duplicates so there are no overwrite issues
		if (newPage.exists) {
		newPage = renameDuplicate(cleanExportName,tempFolder,0);
		}

		//hides all layers but the current one
		isolateLayer(files[i]);

		doc.saveAs(newPage,pngOpts,true);	

		docList.push(newPage);
	}

	//Runs photoshop method to generate PDFs in specified path
	app.makePDFPresentation(docList, pdfName, presentationOptions);

	//Runs through the temp folder and deletes all files
	for (var i = 0; i < docList.length; i++) {
		docList[i].remove();
	}

	//deletes temp folder
	tempFolder.remove();
	
}

//attempts to append '-1' at the end of filename, if that doesnt work it iterates through numbers until it encounters one that does
function renameDuplicate(fileID, saveFolderID, value) {
	var i = value + 1;

	var newFile = new File(saveFolderID + "/" + fileID + "-" + i + ".png");
	if (newFile.exists) {
		newFile = renameDuplicate(fileID,saveFolderID,i);
	}

	return newFile;
}

//finds all groups under _parent, sets them to visible
function enableGroups(parent){
	for (var i = 0; i < parent.layers.length; i++){
        var theLayer = parent.layers[i];
        if (theLayer.typename === "LayerSet"){ 
        	theLayer.visible = true;
        	enableGroups(theLayer);				 			
        }
    }
}

//sets all but _layerToIsolate and groups as invisible
function isolateLayer(layerToIsolate){
	selectAllLayers();
	hideLayers();
	enableGroups(doc);
	layerToIsolate.visible = true;
}


// selectAllLayers - select all layers (Select > All Layers)
function selectAllLayers() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    var desc = new ActionDescriptor();
    desc.putReference(cTID('null'), ref);

    executeAction(sTID('selectAllLayers'), desc, DialogModes.NO);
}


// hideLayers - hide all selected layers (Layer > Hide Layers)
function hideLayers() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    var list = new ActionList();
    list.putReference(ref);
    var desc = new ActionDescriptor();
    desc.putList(cTID('null'), list);
    executeAction(cTID('Hd  '), desc, DialogModes.NO);
}

//these functions are called by the Hide/Show layers functions
function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}