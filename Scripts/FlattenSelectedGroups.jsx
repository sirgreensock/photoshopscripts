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
        deselectAllLayers();

        if (selectedLayers[i].typename === "LayerSet")
        {
            app.activeDocument.activeLayer = selectedLayers[i];

            //Photoshop can only select layers by name, so we need to ensure the name is unique...
            var oldName = selectedLayers[i].name;
            var newName = selectedLayers[i].name + Math.random().toString().substring(2, 15);
            
            //Rename, select by name, rename back to cached name
            selectedLayers[i].name = newName;

            $.write("New name is " + newName );

            selectLayerName(newName);

            selectedLayers[i].name = oldName;

            app.activeDocument.activeLayer.merge();          

        }
        else
        {
            continue;
        }  
    } 
    
}

//ActionReference function to select a layer by name
function selectLayerName(name)
{
    var idslct = charIDToTypeID( "slct" );
    var desc5 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref1 = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        ref1.putName( idLyr, name );
    desc5.putReference( idnull, ref1 );
    var idMkVs = charIDToTypeID( "MkVs" );
    desc5.putBoolean( idMkVs, false );
    var idLyrI = charIDToTypeID( "LyrI" );
        var list1 = new ActionList();
        list1.putInteger( 2 );
    desc5.putList( idLyrI, list1 );
executeAction( idslct, desc5, DialogModes.NO );
}


//Runs undo function
function undo() {
    executeAction(cTID("undo", undefined, DialogModes.NO));
 }; 

 function fuckme()
 {
     executeAction(cTID = function(s) { return app.charIDToTypeID(s); });
     
 }

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

function deselectAllLayers(parentDoc)
{
    var idselectNoLayers = stringIDToTypeID( "selectNoLayers" );

    var desc26 = new ActionDescriptor();

    var idnull = charIDToTypeID( "null" );

        var ref3 = new ActionReference();

        var idLyr = charIDToTypeID( "Lyr " );

        var idOrdn = charIDToTypeID( "Ordn" );

        var idTrgt = charIDToTypeID( "Trgt" );

        ref3.putEnumerated( idLyr, idOrdn, idTrgt );

    desc26.putReference( idnull, ref3 );

    executeAction( idselectNoLayers, desc26, DialogModes.NO );
}

//these functions are called by various ScriptListener-based functions
function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}

