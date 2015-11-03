# Follow The Money
This project is a data visualization of the Follow The Money project lead by Joseph E Taylor III exploring a spatial history of in-lieu programs for western federal lands.

### Basic Technology Stack, Libraries & Feat.s:
	. HTML
	. CSS , SCSS
	. Javascript , d3.js library , d3 carto map (see lib)

### File Structure:
	. `root/index.html`
			This contains all of the html for the main page and interaction level of this projection
	. `pages/*`
			This folder contains the templates for the full description pages for each program
	. `assets/sass/*`
			This folder contains all of the sass / scss files that are used to create the css Filenames
			Sass was here used for the benefit of legibility and ease of variable control
			More information on sass can be found at : http://sass-lang.com/
	. `assets/css/*`
			This folder contains all of the css files created by sass
	. `data/*`
			This folder contains all files for data control. These files were left in csv form as this was easiest
			for client manipulation with the exception of menu.json which controls the menu options for the
			interactive platform (program selection).  More information on changing these files is in the next section
	. `assets/images/*`
			This folder contains all the image files used in the base of this platform
	. `assets/lib/*`
		 	This folder contains all the public libraries and resources used (as of 01 SEP 2015: d3, d3-carto, colorbrewer, and sliderjs)
	. `topojson_files/*`
			This folder contains all the shapefiles, geo/topo/json files used to create the
			reference "Resources & Notes Used" section below.

## Notes for Students:
These suggestions are for new student developers coming on to this project. Some "helpful hints"
for programmatic or editor-level suggestions are specific to the Atom editor, but there are equivalents for
many other text editors.

### Text Editor Suggestions:
	- Atom (https://atom.io/)
			The current project (as of 01 SEP 2015) has been developed using the Atom editor.
			This is a free open source hackable text editor that has become relatively popular (I think third to
			Sublime Text and )
	- Sublime Text (http://www.sublimetext.com/)
			Also a great text editor, very popular, free version available.
	- Brackets (http://brackets.io/)
			Free text editor from Adobe. Light weight, but powerful modern text editor.
	- Coda (https://panic.com/coda/)
	- Development Environment
			This project doesn't need much (as of 28 OCT 2015) by way of specific server settings. It was created with am AMPPS/localserver envir. (http://www.ampps.com/)

## Server Information
This project's beta version (as of 28 OCT 2015) is hosted at : http://web.stanford.edu/group/spatialhistory/FollowTheMoney/

	 - For help pushing to the Stanford server you must have a Stanford id and password and access to the spatialhistory group as well as permissions to push to the FollowTheMoney site.
	 - You can use any of a number of file transfer programs (such as Fetch, Filezilla, OpenAFS, SecureFX -- depending on system) A few are mentioned here : https://itservices.stanford.edu/service/afs and are available for free download here (mac: https://itservices.stanford.edu/service/ess/mac or pc: https://itservices.stanford.edu/service/ess/pc)
	 - Notes for updating files: As of 28 OCT 2015 there is no link between the github storage and Stanford AFS server. So to update the site, the repository should be updated and the updated pieces of the project uploaded to the afs space to replace outdated files.

## Data Notes

### Data Files
:: the data file headers and naming conventions must be retained for the data to be parsed and displayed correctly as of 28 OCT 2015.

	- `Master_simple.csv` : contains the entire dataset. It is important to maintain the headers of these datasets
			as they are.  If data is added, the header should follow the pattern and added to the menu.json file.

	- `menu.json` : contains information for the program menu including
			* "id" : must be equal to the abbreviation used in data file header.
			* "menu_abbrev" : must be equal to abbreviation used in the menu.
			* "active" : true - will appear as an active menu link. false - will appear as an inactive menu link.
			* "start_year" : (as of 22 OCT 2015) currently affects when maptips appear, but generally holds the start year for the program.
			* "intro_text", "description", "full_description", "key_trends", "biblio" : these currently contain full texts in HTML format (remember to escape characters, place line breaks, etc.), in the future it may make more sense to divide these into file references.  For now we do not have all of the description data.

	- `inter_county_class_breaks.csv` : contains information for class breaks for general map (compared against all other counties / when the Advanced feature is disabled).

	- `intra_county_class_breas/*` : contains class break information for each program comparing counties against their own historical average (when the Advanced feature is enabled).

	- `county_ranks_overall.csv` : contains notes for each county's summary (how they compare to other counties). Used to create the chart summary statement for a selected county (the sentence that appears below the chart upon selection of a county).

	- `us_medians_by_year.csv` : contains average information for each program by year. This is used for chart's average line.

	- All data file references are currently stored in the `map_setup.js` file under the variable declaration sub section
			"Store Filenames". These will need to be updated if the files structure is changed.

### Steps for Making Changes: (as of 28 OCT 2015)
To make any changes, make your changes locally, push to GitHub, and replace the updated files to the Server (as noted above in Server Information). This will likely be changing once the database setup is complete.

#### Adding or Removing Programs:
	1. Make appropriate changes to the `data/Master_simple.csv`
	2. Update the menu.json to reflect the proper id (the same as column headers in all files), menu abbreviation, active status, start year, and descriptive texts.
	3. Ensure that all the data documents include the proper id heading and relevant information
		* `inter/intra county class breaks` -- this is really important as it sets up the class breaks, legend, and css used. This can be optionally hooked up to the auto-calc functions in `calc_functions.js`
		* `county_ranks_overall.csv` -- this affects the summary statement (ensure that the current standard of wording is maintained)
		* `us_medians_by_year.csv` -- this affects chart average line
	4. Commit and push changes to the repository and exchange updated files on the server.

#### Changing Data
	1. Open the `data/Master_simple.csv`.
	2. Update the necessary cells to make changes to the data.
	3. Save the updated version of the csv file.
	4. Commit and push changes to the repository and exchange updated files on the server.


## Development Notes
### -- For Development Only --

#### TODO List:
 - [ ] Glossary Page ?
 - [ ] extending timeline**
 - [ ] Link Full Text Pages
 - [ ] Test Years update from files
 - [ ] Timeline funkiness
 - [ ] Touch Sensing Fix
 - [ ] Break up JS file into sub files
 - [ ] Minify Docs for deployment

#### CHECKED List:
 - [x] Fix full description button
 - [x] Fix description, key trends button
 - [x] Replace switch map button with checkbox
 - [x] Switch checkbox style
 - [x] Refresh graph between programs
 - [x] Set up no data & ineligible
 - [x] Link New Data
 - [x] Touch Sensing Fix
 - [x] Link Rankings CSV
 - [x] Inactive menu items
 - [x] No county fix
 - [x] Update Chart Legend color classes for intra county
 - [x] Dash for underscore (traded for icon instead)
 - [x] Keep current year consistent
 - [x] Align intersection of divs
 - [x] 0-20% included in intra county map lowest color_class
 - [x] empty legend div for chart @ empty selection
 - [x] Country shadow
 - [x] Highlight county
 - [x] County rollover tooltip
 - [x] Chart Label (current year)
 - [x] Titles and program tooltips
 - [x] Scale Chart tick marks
 - [x] Check Tables for remaining maps (to ensure they include relevant ST_CNTY data that is consistent with the data tables)
 - [x] Maintain Chart at all times (including init handling)
 - [x] Current year handler
 - [x] Create code for time controller
 - [x] Create code for map controller (for switching maps)
 - [x] Adjust CSS
 - [X] Edit ProgramYearTip -- tip for year that a program starts
 - [x] adjust time chart dimensions**
 - [x] Edit down maps to only include relevant States
 - [x] Check if Custom CSS is properly Linked
 - [x] Think of options for staggered datasets (multiple csv/tsv files)
 - [x] Check in about the inconsistency in ST_CNTY Data
 - [x] Adjust data loader for multiple decades **
 - [x] Include min & max for each category of data in the line chart creation
	Think of a way to automate this?? ^
 - [x] Edit scatterplot/linechart to reflected cross-decadal data
 - [X] Naming States
 	Note: had to manually set transformation and state/city categories. -- Alignment is off*
 - [X] Remove Background section from main interactive page
 - [X] Switch Checkbox functionality hookup
 - [X] Fix background width
 - [X] No Data color: #f4f4f4
			 0 : None
		 Null : No Data
		 -999 : Not Eligible
 - [X] Link Main ReadMore link
 - [X] Maptip delay fix


## --- DEVELOPER NOTES ---

States of Interest:
	* AZ - Arizona - FIPS 04
	* CA - California - FIPS 06
	* CO - Colorado - FIPS 08
	* ID - Idaho - FIPS 16
	* MT - Montana - FIPS 30
	* NM - New Mexico - FIPS 35
	* NV - Nevada - FIPS 32
	* OR - Oregon - FIPS 41
	* UT - Utah - FIPS 49
	* WA - Washington - FIPS 53
	* WY - Wyoming - FIPS 56

FIPS of Interest:
	('040', '060', '080', '160', '300', '350', '320', '410', '490', '530', '560')

### Resources & Notes Used

###### **** THIS WAS USED IN THE LATEST VERSION ****
	Pulled down files from mapshaper.org
	NOTES for Creating Topojson Files:

	```
	ogr2ogr \
		  -f GeoJSON \
		  -where "ADM0_A3 IN ('GBR', 'IRL')" \	//**Wasn't used, but can be used to select subset of data**
		  subunits.json \
		  ne_10m_admin_0_map_subunits.shp

	ogr2ogr -f GeoJSON -s_srs albers.prj -t_srs EPSG:4326 wc_wgs84_geo.json Western_Counties_sm/wc.json

	topojson -o wc_wgs84_topo.json --id-property id -- wc_wgs84_geo.json
	```

	D3.CARTO.MAP :: https://github.com/emeeks/d3-carto-map/wiki/API-Reference


### ---  Other Useful Information & Resources ---

* Resource: http://www.tnoda.com/blog/2013-12-07

	```
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
	```

	Useful Commands:

	```
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
	```


* Bubble Map Example
	http://bost.ocks.org/mike/bubble-map/

* FIPS:
	http://en.wikipedia.org/wiki/Federal_Information_Processing_Standard_state_code

* Button Press Example:
	http://bl.ocks.org/d3noob/7030f35b72de721622b8

* Chloropleth Ex:
	http://bl.ocks.org/mbostock/4060606
	http://bl.ocks.org/fhernand/be1e9c9fdb0473292abf

* Tutorial:
	http://alignedleft.com/tutorials/d3

* NY Times Example - The Geography of Government Benefits
	http://www.nytimes.com/interactive/2012/02/12/us/entitlement-map.html?_r=0

* Examples & Resources (courtesy of Jason Heppler):
	- https://github.com/emeeks/d3-carto-map/
	- http://lincolnmullen.com/projects/slavery/
	- http://bl.ocks.org/mbostock/9744818
	- http://jasonheppler.org/2013/08/06/getting-started-with-d3/
