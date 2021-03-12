// Flatten Selected Groups
// Nikola Odic 2021
//
// This version of the script will:
// - For each group selected merge separately into individual layers

#target Photoshop;

// GLOBAL VARIABLES
var doc; //Active Document reference

//Save history state for easy undo of the script
app.activeDocument.suspendHistory("StartScript", "main()");   

//Check if a document is open, open initial dialog window
function main(){
	if (app.documents.length <= 0) {
		alert( "Error: A Document must be opened!" );
		return 'cancel';	
	} else {
		doc = app.activeDocument;		
		start();
	}
}

//Push all selected layers into an array then deselect them all
//For every group encountered select it, merge down
//Skip any non group encountered
function start()
{
    var selectedLayers = getSelectedLayers(app.activeDocument);

    if (selectedLayers == 0 || selectedLayers == NaN)
    {
        alert("Error: No layers are selected!");
    }

    for( i = 0; i < selectedLayers.length; i++)
    {
        if (selectedLayers[i].typename === "LayerSet")
        {
            selectedLayers[i].selected = true;
            selectedLayers[i].merge();
        }
        else
        {
            continue;
        }  
    } 
}

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
    layers[i].selected = false;
  }

  undo();

  return selLayers;
};

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

//these functions are called by various ScriptListener-based functions
function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}

