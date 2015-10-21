# Follow The Money README.txt

This project was created by Krista Fryauff: kfryauff@stanford.edu // krista.fryauff@gmail.com for questions
### Basic Technology Stack:
	. HTML
	. CSS , SCSS
	. Javascript , d3.js library

### File Structure:
	. root/index.html
			This contains all of the html for the main page and interaction level of this projection
	. program_pages/*
			This folder contains the templates for the full description pages for each program
	. sass/*
			This folder contains all of the sass / scss files that are used to create the css Filenames
			Sass was here used for the benefit of legibility and ease of variable control
			More information on sass can be found at : http://sass-lang.com/
	. css/*
			This folder contains all of the css files created by sass
	. data/*
			This folder contains all files for data control. These files were left in csv form as this was easiest
			for client manipulation with the exception of menu.json which controls the menu options for the
			interactive platform (program selection).  More information on changing these files is in the next section
	. images/*
			This folder contains all the image files used in the base of this platform
	. lib/*
		 	This folder contains all the public libraries and resources used (as of 01 SEP 2015: d3, d3-carto, colorbrewer, and sliderjs)
	. topojson_files/*
			reference "Resources & Notes Used" section below

### Notes for Students:
I make these suggestions for new/student developers coming on to this project and note that some "helpful hints"
for programmatic or editor-level suggestions are specific to the Atom editor, but there are equivalents in
many other text editors.

#### Editor Suggestions:
	. Atom (https://atom.io/)
			The current project (as of 01 SEP 2015) has been developed using the Atom editor.
			This is a free open source hackable text editor that has become relatively popular (I think third to
			Sublime Text and )
	. Sublime Text (http://www.sublimetext.com/)
			Also a great text editor, very popular, free version available.
	. Brackets (http://brackets.io/)
			Free text editor from Adobe. Light weight, but powerful modern text editor.
	. Coda (https://panic.com/coda/)

## To Make Data Changes

### Data Files :: the data file headers and naming conventions must be retained for the data to be parsed and
displayed correctly as of 01 SEP 2015.

	. Master_simple.csv : contains the entire dataset. It is important to maintain the headers of these datasets
			as they are.  If data is added, the header should follow the pattern and added to the menu.json file.

	. menu.json : contains information for the program menu including
			: menu_abbrev : must be equal to the abbreviation used in data files.
			: intro_text, description, full_description, key_trends, biblio : these currently contain full texts,
					in the future it may make more sense to divide these into file references.  For now we do not have
					all of the description data.

	. All data files are currently stored in the map_setup.js file under the variable declaration sub section
			"Store Filenames". These will need to be updated if the files structure is changed.

## --- FOR DEVELOPMENT ONLY ---

#### TODO List:
::TODO::
:: Switch Checkbox functionality hookup
:: Fix background width
:: Naming States
:: Edit ProgramYearTip -- tip for year that a program starts
:: Link Main ReadMore link
:: Link Full Text Pages
:: Summary Sentence -- wait for intra-county description
:: Touch Sensing Test
:: Format Rankings
:: Break up JS file into sub files

:: Glossary Page
:: Read More --> separate page
:: Separate Page
:: extending timeline**


#### CHECKED List:
:: Fix full description button
:: Fix description, keytrends button
:: Replace switch map button with checkbox
:: Switch checkbox style
:: Refresh graph between programs
:: Set up no data & inelligible
:: Link New Data
:: Touch Sensing Fix
:: Link Rankings CSV
:: Inactive menu items
:: No county fix
:: Update Chart Legend color classes for intra county
:: Dash for underscore (traded for icon instead)
:: Keep current year consistent
:: Allign intersection of divs
:: 0-20% included in intra county map lowest color_class
:: empty legend div for chart @ empty selection
:: Country shadow
:: Highlight county
:: County rollover tooltip
:: Chart Label (current year)
:: Titles and program tooltips
:: Scale Chart tick marks
:: Check Tables for remaining maps (to ensure they include relevant ST_CNTY data that is consistent with the data tables)
:: Maintain Chart at all times (including init handling)
:: Current year handler
:: Create code for time controller
:: Create code for map controller (for switching maps)
:: Adjust CSS
:: adjust timechart dimensions**
:: Edit down maps to only include relevant States
:: Check if Custom CSS is properly Linked
:: Think of options for stagered datasets (multiple csv/tsv files)
:: Check in about the inconsistency in ST_CNTY Data
:: Adjust data loader for multiple decades **
:: Include min & max for each category of data in the line chart creation
	Think of a way to automate this?? ^
:: Edit scatterplot/linechart to reflected cross-decadal data

## --- DEVELOPER NOTES ---

States of Interest:
AZ - Arizona - FIPS 04
CA - California - FIPS 06
CO - Colorado - FIPS 08
ID - Idaho - FIPS 16
MT - Montana - FIPS 30
NM - New Mexico - FIPS 35
NV - Nevada - FIPS 32
OR - Oregon - FIPS 41
UT - Utah - FIPS 49
WA - Washington - FIPS 53
WY - Wyoming - FIPS 56

FIPS of Interest:
('040', '060', '080', '160', '300', '350', '320', '410', '490', '530', '560')

** Resources & Notes Used **

**** THIS WAS USED IN THE LATET VERSION ****
	Pulled down files from mapshaper.org
	NOTES for Creating Topojson Files:

	ogr2ogr \
		  -f GeoJSON \
		  -where "ADM0_A3 IN ('GBR', 'IRL')" \
		  subunits.json \
		  ne_10m_admin_0_map_subunits.shp

	ogr2ogr -f GeoJSON -s_srs albers.prj -t_srs EPSG:4326 wc_wgs84_geo.json Western_Counties_sm/wc.json

	topojson -o wc_wgs84_topo.json --id-property id -- wc_wgs84_geo.json

	RESOURCES USED:

	D3.CARTO.MAP :: https://github.com/emeeks/d3-carto-map/wiki/API-Reference


--- OTHER USEFUL INFORMATION ---

http://www.tnoda.com/blog/2013-12-07
	geojson
		ogr2ogr -f GeoJSON new_file_name.json shape_file.shp
		ogr2ogr \
		  -f GeoJSON \
		  -where "ADM0_A3 IN ('GBR', 'IRL')" \
		  subunits.json \
		  ne_10m_admin_0_map_subunits.shp
	topojson
		topojson \
		  -o uk.topo.json \
		  --id-property SU_A3 \
		  --properties name=NAME \
		  -- \
		  subunits.json \
		  places.json

	Actual Commands Used:
		>> GEOJSON:
		ogr2ogr -f GeoJSON -where "STATE IN ('040', '060', '080', '160', '300', '350', '320', '410', '490', '530', '560')" json_file.json shape.shp

		>> TOPOJSON:
		topojson -o topo_json_file.topo.json --id-property ST_CNTY --width=650 --height=460 -- json_file.json


		>> GEOJSON (broken up by attribute):
		ogr2ogr \
			-f GeoJSON \
			-where "STATE IN ('040', '060', '080', '160', '300', '350', '320', '410', '490', '530', '560')" \
			json_file.json \
			shape.shp

		>> TOPOJSON (broken up by attribute):
		topojson \
			-o topo_json_file.topo.json \
			--id-property ST_CNTY \
			--width=650 \
			--height=460 \
			-- json_file.json



Bubble Map Example (useful!!)
http://bost.ocks.org/mike/bubble-map/

FIPS: http://en.wikipedia.org/wiki/Federal_Information_Processing_Standard_state_code

Button Press Example:
http://bl.ocks.org/d3noob/7030f35b72de721622b8

Chloropleth Ex:
http://bl.ocks.org/mbostock/4060606
http://bl.ocks.org/fhernand/be1e9c9fdb0473292abf

Tutorial:
http://alignedleft.com/tutorials/d3

NY Times Example - The Geography of Government Benefits
http://www.nytimes.com/interactive/2012/02/12/us/entitlement-map.html?_r=0
