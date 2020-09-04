# photoshopscripts
Collection of Photoshop scripts I've written -- Free to use under MIT License

Tested and compatible with all CC versions of Photoshop but should probably work with earlier versions as well.

## Installation
Copy script .jsx files into the Scripts folder wherever you have Photoshop installed eg. `C:\Program Files\Adobe\Adobe Photoshop CC 2018\Presets\Scripts`

## ExportLayers
This script will export all layers from an opened Photoshop file into uncompressed 32-bit PNG files. It has a number of settings:
* Select save destination -- By default is set  to the same filepath as the original file)
* Export selected layers only -- If true only currently selected layers will be exported, defaults to exporting each layer as an individual PNG file
* Create sub-folders -- If true it will create sub-folders in the destination folder for each Group that is encountered. By default it will save all PNG files in the same location
* Overwrite conflicts -- If true any matching filename will be overwritten. By default it will append a '-#' at the end of filenames when conflicts are encountered
* Ignore invisible layers -- If true it will not attempt to export any layers that are not visible.

## Export To PDF

## Flatten Adjustment Layers
