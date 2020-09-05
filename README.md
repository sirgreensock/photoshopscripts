# photoshopscripts
Collection of Photoshop scripts I've written -- Free to use under MIT License

Tested and compatible with all CC versions of Photoshop but should probably work with earlier versions as well.

## Installation
Copy script .jsx files into the Scripts folder wherever you have Photoshop installed eg. `C:\Program Files\Adobe\Adobe Photoshop CC 2018\Presets\Scripts`

## ExportLayers
![Screenshot showing script popup options detailed below](/Screenshots/Screenshot-ExportLayers.png)

This script will export all layers from an opened Photoshop file into separate uncompressed 32-bit PNG files. It has a number of settings:
* Select save destination -- By default is set  to the same filepath as the original file
* Filename prefix and suffix options
* Export selected layers only -- If true only currently selected layers will be exported, defaults to exporting each layer as an individual PNG file
* Create sub-folders -- If true it will create sub-folders in the destination folder for each Group that is encountered. By default it will save all PNG files in the same location
* Overwrite conflicts -- If true any matching filename will be overwritten. By default it will append a '-#' at the end of filenames when conflicts are encountered
* Ignore invisible layers -- If true it will not attempt to export any layers that are not visible.

## Export To PDF
![Screenshot showing script popup options detailed below](/Screenshots/Screenshot-ExportPDF.png)

This script will export all layers from an opened Photoshop file into PDF presentations. It can export all files into a single presentation, or separate groups into individual ones. It has a number of settings:
* Export groups as separate PDF presentations -- This setting will attempt to separate layers out based on their groups, generating a separate presentation for each. Note that nested groups can cause issues!
* Export entire document as a single presentation -- This setting will collapse all the groups  and treat each layer as a page in a single presentation
* Select save destination -- By default is set  to the same filepath as the original file
* Automatic filenames -- This setting will name the presentation based on the name of the document (for ungrouped layers) and based on group names (for grouped layers)
* Manual filenames -- This setting will override the name of the file when the entire document is exported as a single presentation

## Flatten Adjustment Layers

This script will take any selected Adjustment Layer and merge it down to layers below it that it can affect. If it is in a clipping mask it will only affect what it is clipped to, otherwise it will check all layers below it and merge down to them.
*Note* -- Adjustment layers will only be merged down to regular art layers, Text, Smart, Video, and Path layer types will be ignored.

