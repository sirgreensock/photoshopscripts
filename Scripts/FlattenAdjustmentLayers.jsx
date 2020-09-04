// Flatten Adjustment Layers Down script
// Copyright 2020 Nikola Odic
//
// This script will take any selected Adjustment Layer and merge it down to layers below it that it can affect
// If it is in a clipping mask it will only affect what it is clipped to, otherwise it will check all layers below it
//
// Because I am lazy this script does not work with: Text layers, Smart layers, Video layers, Path layers
//
// Feel free to distribute I don't give a shit
// Love,
// Nik

#target Photoshop

//Reference to the open document
var doc;

//Reference to the target adjustment layer
var adj_layer;

//Array to hold all layers to be flattenned down to
var layersArray = [];

//Array of all clipping layers that need to be re-clipped
var clippingArray = [];

//Save history state for easy undo of the script
app.activeDocument.suspendHistory("StartScript", "Init()");   

//Check that a document is open, then check that the current layer is an adjustment layer
function Init()
{
   if (app.documents.length <= 0) 
   {
		alert( "Error: A Document must be opened!" );
		return 'cancel';	
	} 
    else 
    {
		//set active document as current document
        doc = app.activeDocument;	
        
		if (doc.activeLayer.kind != LayerKind.NORMAL && doc.activeLayer.typename !== "LayerSet" )
       {
           Start();
       }
        else 
        {
            alert( "Error: Selected layer is not an adjustment layer" );
            return 'cancel';
        }
    }     
}


function Start()
{     
    //Current layer is assumed to be an adjustment layer
    adj_layer = doc.activeLayer;  
    
    //Reference to the open file
    var parent = adj_layer.parent;
    
    //If adjustment layer is grouped, the parent is only the group. Else handles all layers normally
    if (adj_layer.grouped) 
    {
       //reference to the layer it is grouped to
       var groupedLayer;
       
       //Check through all the layers and find the one with the itemIndex value below the grouped layer
       for (var n = 0; n < doc.layers.length; n++)
       {
           if (doc.layers[n].itemIndex == adj_layer.itemIndex - 1)
           {
               groupedLayer = doc.layers[n];
               break;
           }
            else 
           {
               continue;
           }
       }
        
       //If the grouped layer is a folder, handle only the folder
       //If it is a regular layer, handle only that layer
       //If its none of the above assume the grouped layer is invalid and throw error
       if (groupedLayer.typename == "LayerSet")
       {
            SortLayers(groupedLayer);
       }
        else if (groupedLayer.kind == LayerKind.NORMAL)
       {           
            layersArray.push(groupedLayer);
       }
        else
       {
            alert( "Error: The adjustment layer is grouped to an invalid layer type. Must be a folder or art layer" );
            return 'cancel';	
       }        
    }
    else
    {
        //iterate through all layers up to the current one
        SortLayers(doc);
    }
    
    //If there are layers to merge to, handle placement. Otherwise throw generic error
    if (layersArray.length > 0)
    {
        HandleLayerPlacement(layersArray);
     
        adj_layer.remove();
     }
     else
     {
        alert( "Error: No valid layers were found!" );
        return 'cancel';	
     }
    
    return;
}

//Iterate through all layers in the listed parent
//Send any valid art layers to an array to handle merging
//Re-iterate on any sub-folders
function SortLayers(parent)
{
    for (var n = 0; n < parent.layers.length ; n++)    
    {
        //handle sub folders separately
        if (parent.layers[n].typename == "LayerSet")
        {
            SortLayers(parent.layers[n]);
            continue;
        }
        //ignore self and other adjustment layers
        if (parent.layers[n] == adj_layer || parent.layers[n].kind != LayerKind.NORMAL)
        {
            continue;
        }
        //skip layers that are above the adjustment layer
        if (parent.layers[n].itemIndex > adj_layer.itemIndex)
        {
            continue;
        }       
        
        layersArray.push(parent.layers[n]);
    }
}

// For each layer in the array:
// Duplicate the adjustment layer directly above
// Select the new adjustment layer
// Merge down
 function HandleLayerPlacement(targetArray)
 {
    for (var n = 0; n < targetArray.length; n++)
    {
        //If the layer is in a clipping mask, release the clipping mask before merging down, then push the layer to an array to re-clip later
        if (targetArray[n].grouped)
        {
            doc.activeLayer = targetArray[n];
            
            ReleaseClippingMask();
            
           var layer = adj_layer.duplicate(targetArray[n], ElementPlacement.PLACEBEFORE);
            
           doc.activeLayer = layer;        

            executeAction(stringIDToTypeID("mergeLayersNew"), undefined, DialogModes.NO);
            
            clippingArray.push(targetArray[n]);
        }
        else
        {
             var layer = adj_layer.duplicate(targetArray[n], ElementPlacement.PLACEBEFORE);
            
            doc.activeLayer = layer;        

            executeAction(stringIDToTypeID("mergeLayersNew"), undefined, DialogModes.NO);
        }   
    
        continue;
    }

    // Iterate backwards (bottom-to-top in Photoshop layers) and remake clipping masks
    if (clippingArray.length > 0)
    {
        for (var n = clippingArray.length - 1; n >= 0; n--)
        {
            doc.activeLayer = clippingArray[n];
            MakeClippingMask();
            continue;
        }
    }

   alert( "All Done!" );
 }

//ScriptListener function to Release Clipping Mask
function ReleaseClippingMask() {
	var c2t = function (s) {
		return app.charIDToTypeID(s);
	};

	var s2t = function (s) {
		return app.stringIDToTypeID(s);
	};

	var descriptor = new ActionDescriptor();
	var reference = new ActionReference();

	reference.putEnumerated( s2t( "layer" ), s2t( "ordinal" ), s2t( "targetEnum" ));
	descriptor.putReference( c2t( "null" ), reference );
	executeAction( s2t( "ungroup" ), descriptor, DialogModes.NO );
}

//ScriptListener function to Make Clipping Mask
function MakeClippingMask() {
	var c2t = function (s) {
		return app.charIDToTypeID(s);
	};

	var s2t = function (s) {
		return app.stringIDToTypeID(s);
	};

	var descriptor = new ActionDescriptor();
	var reference = new ActionReference();

	reference.putEnumerated( s2t( "layer" ), s2t( "ordinal" ), s2t( "targetEnum" ));
	descriptor.putReference( c2t( "null" ), reference );
	executeAction( s2t( "groupEvent" ), descriptor, DialogModes.NO );
}