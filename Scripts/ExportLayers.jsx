// New Export Layers to Files
// Nikola Odic 2020
//
// This version of the script will:
// -maintain layer names intact as file name
// -only generate transparent PNG files
// -supports creating a folder hierarchy that matches the group hierarchy
// -selectively trims layers, can ignore invisible layers
// Update September 2020 -- Added option to only export the currently selected layer

#target Photoshop

// GLOBAL VARIABLES
var doc; //Active Document reference

var savePath = new Folder("~/Desktop").fsName; //save location
var pathText; //user override for save location

//define default save options
var pngOpts = new PNGSaveOptions;
pngOpts.compression = 0;
pngOpts.interlaced = false;

var prefixText; //filename prefix
var suffixText; //filename suffix

var selectedLayersOnly; //should only the selected layers be exported or all layers in file?
var createSubFolders; //should folders be created for every Group encountered?
var overwriteConflicts; //how should filename conflicts be treated
var trimLayers; //should each layer be cropped to its bounds
var ignoreInvisible; //should invisible layers be ignored

var layerArray = []; //array of all layers in the document

var history; //object to hold history states

//Save history state for easy undo of the script
app.activeDocument.suspendHistory("StartScript", "main()");   

//Check if a document is open, open initial dialog window
function main(){
	if (app.documents.length <= 0) {
		alert( "Error: A Document must be opened!" );
		return 'cancel';	
	} else {
		doc = app.activeDocument;		
		startDialog();
	}
}

//Dialog window with destination and file options
function startDialog(){
	var saveDialog = new Window('dialog',"Export Layers To Files");
	saveDialog.orientation = 'column';
	saveDialog.add("statictext",undefined,"Destination:")

	var pathGroup = saveDialog.add('group');
    
    //Check if the document has previously been saved, if yes the default save location is the same as the document path
    try {
        var docPath = activeDocument.path;
        savePath = doc.path.fsName; //Converts document path to human readable path
        }
    catch (e) {
            $.write("Document is not saved, defaulting to Desktop!");
        }

	pathText = pathGroup.add("edittext",undefined, savePath);
	pathText.characters = 30;
	var browseBtn = pathGroup.add("button",undefined,"Browse");

	var formatPanel = saveDialog.add('panel');
	formatPanel.alignment = 'fill';

	formatPanel.group = formatPanel.add('group');
	formatPanel.group.orientation = 'row';	

	formatPanel.group1 = formatPanel.group.add('group');
	formatPanel.group1.orientation = 'column';
	var prefixTextDescription = formatPanel.group1.add('statictext',undefined,"Filename Prefix:")
	prefixText = formatPanel.group1.add('edittext');
	prefixText.characters = 20;

	formatPanel.group2 = formatPanel.group.add('group');
	formatPanel.group2.orientation = 'column';
	var suffixTextDescription = formatPanel.group2.add('statictext',undefined,"Filename Suffix:")
	suffixText = formatPanel.group2.add('editText');
	suffixText.characters = 20;

	formatPanel.group3 = formatPanel.add('group');
     selectedLayersOnly = formatPanel.group3.add('checkbox',undefined,"Export Selected Layers Only");
	selectedLayersOnly.value = false;
	createSubFolders = formatPanel.group3.add('checkbox',undefined,"Create Sub-Folders");
	createSubFolders.value = false;
	overwriteConflicts = formatPanel.group3.add('checkbox',undefined,"Overwrite")
	overwriteConflicts.value = true;
	trimLayers = formatPanel.group3.add('checkbox', undefined, "Trim Layers");
	trimLayers.value = true;
	ignoreInvisible = formatPanel.group3.add('checkbox',undefined,"Ignore Invisible Layers");
	ignoreInvisible.value = true;

	var buttonGroup = saveDialog.add('group');
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
			alert("Invalid Save Destination!");
			saveDialog.close();	
			return 'cancel'
		} else {
			savePath = checkPathText.fsName;
			saveDialog.close();

			//save initial history state	
			setHistory(); 
                
                //check which layers to export
               if (selectedLayersOnly)
                {
                   handleExportSelectedLayers();                   
                   }
               else
                {
                    //grab all valid layers to be exported
                    sortLayers(doc, layerArray);
                    }
            

			//save out each layer
			for (var i = 0; i < layerArray.length; i++) {
				saveLayers(layerArray[i]);
				resetHistory();						
			}
			alert('Finished exporting ' + layerArray.length + " layers to " + savePath + "!");
		}		
	}

	saveDialog.show(); 
}

//If only selected layers are being exported
//Push only selected layers to the export layers array
function handleExportSelectedLayers() {
    
    var selectedLayers = getSelectedLayers(app.activeDocument);


    for( i = 0; i < selectedLayers.length; i++) {
    selectedLayers[i].selected = true;
    layerArray.push(selectedLayers[i]);    
 }
   
};

//goes through all layers in parent, if an art layer is encountered it pushes to array, if a group is encountered it repeats the script
function sortLayers (parent,targetArray){
    for (var i = 0; i < parent.layers.length; i++){
        var theLayer = parent.layers[i];

        //Looks for art layers, ignores background layer and non-Normal type layers (ignores text, shape etc layers)
        if (theLayer.typename === "ArtLayer" && theLayer.isBackgroundLayer != true && theLayer.kind == LayerKind.NORMAL){
        	
        	//check if invisible layers should be ignored
        	if (ignoreInvisible.value) {
        		if (theLayer.visible) {
        			targetArray.push(theLayer)
        		}

        	} else {
        	   			targetArray.push(theLayer)
        	   		}
   					 			
        } else if (theLayer.typename === "LayerSet"){
            
            //if a group is encountered search layers in group
            sortLayers(theLayer, targetArray);            
        } else {
        	continue;
    		};
    }
}

//Processes layer and saves it in target directory
function saveLayers(layerID) {

	resetHistory();
	doc.activeLayer = layerID;

	//Sets filename prefix + suffix
	layerName = prefixText.text + layerID.name + suffixText.text;

	//Sets all layers but this one invisible
	isolateLayer(layerID);

	//If trimming is enabled:
	//disable selection, if any
	//select layer
	//select pixels in layer
	//crop to selection
	if (trimLayers.value) {
		doc.selection.deselect();
		doc.activeLayer = layerID;
		selectLayerPixels();
		crop();
	}

	//defines name of subfolders based on group name
	var parentName = "";
	if (createSubFolders.value){
		//Ignores the root parent name (the document)
		if (layerID.parent.typename != "Document") {
			parentName = layerID.parent.name;
		}
	}
	
	//Defines save folders, checks if it needs to be created
	var saveFolder = new Folder(savePath + '/' + parentName);
	if (!saveFolder.exists) {
			saveFolder.create();
		}

	//define name of file, check if duplicate exists
	var layerFile = new File(saveFolder + "/" + layerName + ".png");
	if (!overwriteConflicts.value && layerFile.exists) {
		layerFile = renameDuplicate(layerName,saveFolder,0);
	}
	
	//save layer as PNG	
	doc.saveAs(layerFile,pngOpts,true);	
	resetHistory();
}

//In case of duplicate filename, append a number to the end of the filename (eg. newFileName-1.png)
function renameDuplicate(layerID, saveFolderID, value) {
	var i = value + 1;

	var newLayerFile = new File(saveFolderID + "/" + layerID + "-" + i + ".png");
	if (newLayerFile.exists) {
		newLayerFile = renameDuplicate(layerID,saveFolderID,i);
	}
	
	return newLayerFile;
}

//Photoshop doesnt have a preset method to grab the bounds of a layer as a selection, this executes that action manually...
function selectLayerPixels(){
	var id1268 = charIDToTypeID( "setd" );
	var desc307 = new ActionDescriptor();
	var id1269 = charIDToTypeID( "null" );
	var ref257 = new ActionReference();
	var id1270 = charIDToTypeID( "Chnl" );
	var id1271 = charIDToTypeID( "fsel" );
	ref257.putProperty( id1270, id1271 );
	desc307.putReference( id1269, ref257 );
	var id1272 = charIDToTypeID( "T   " );
	var ref258 = new ActionReference();
	var id1273 = charIDToTypeID( "Chnl" );
	var id1274 = charIDToTypeID( "Chnl" );
	var id1275 = charIDToTypeID( "Trsp" );
	ref258.putEnumerated( id1273, id1274, id1275 );
	desc307.putReference( id1272, ref258 );
	executeAction( id1268, desc307, DialogModes.NO )
}

// Crop to Active Selection  
function crop() {  
     function cTID(s) { return app.charIDToTypeID(s); };  
          var desc001 = new ActionDescriptor();  
     executeAction(cTID('Crop'), desc001, DialogModes.NO);  
}  

//purges previous history, sets current state as save state
function setHistory() {
	app.purge (PurgeTarget.HISTORYCACHES);
	history = doc.historyStates.length-1;
}

//reverts file to initial history state
function resetHistory() {
	doc.activeHistoryState = doc.historyStates[history];
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

//Creates new group from selected layers
function newGroupFromLayers(parentDoc) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( sTID('layerSection') );
    desc.putReference( cTID('null'), ref );
    var lref = new ActionReference();
    lref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('From'), lref);
    executeAction( cTID('Mk  '), desc, DialogModes.NO );
};

//Runs undo function
function undo() {
   executeAction(cTID("undo", undefined, DialogModes.NO));
};

//Creates group from selected layers
//pushes contents of group to an array
//undoes the grouping
//returns array of selected layers
function getSelectedLayers(parentDoc) {
  var selLayers = [];
  newGroupFromLayers(parentDoc);

  var group = parentDoc.activeLayer;
  var layers = group.layers;

  for (var i = 0; i < layers.length; i++) {
    selLayers.push(layers[i]);
  }

  undo();

  return selLayers;
};

//these functions are called by various ScriptListener-based functions
function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}