/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2, white: true, maxerr: 50, todo: true */
/*global $, d3, queue, topojson, percentrank, colorbrewer, slider*/

(function () {

	/* TEST VARIABLES */
	// TODO: Delete All Test Variables
	var extra_data;

	/* :: VARIABLE DECLARATION & INSTANTIATION :: */
	var map,                    //Map Variables
			path,
			data = {},
			breaks = {},
			projection,
			tooltip,
			maptip,

			usa_background_layer,   //Map Layers
			other_countries_layer,
			usa_foreground_layer,
			other_state_layer,
			county_layer,
			highlighted_state_layer,
			county_highlight_layer,
			cities_layer,
			labels_layer,

			current_payments_map,   //Map Type Variables
			inter_county = {
				header: "Inter-County Payments",
				sub_header: "in 2014 dollars",
				break_class: "YlGn",
				num_categories: 5
			},
			intra_county = {
				header: "Intra-County Payments",
				sub_header: "Each county\'s payment compared to its historical average",
				break_class: "RdBl",
				num_categories: 6,
				break_labels: ["Minimum Received", "", "",
												"Average Received", "", "",
												"Maximum Received"]
			},

			current_year,           //Time Control Variables
			min_year,
			max_year,
			timeslider,

			linechart_svg,          //Line Chart Variables
			charttip,
			charttips = [],
			county_line_colour = "#F38347",
			background_colour = "#F4F2EE",
			average_colour = "#636260",

			current_category,       //Category Variables
			num_categories,

			menutip;
	var centerbar_width = 653 - 35,
			prog_descr_width = 243,
			chart_height = 180,
			graph_padding = 50;
	// Declare Data Maps
	var rateById = d3.map(),
			manualBreaksById = d3.map(),
			averagesByYear = [],
			ranksByCounty = d3.map(),
			countyStartYear = d3.map(),
			labelData = d3.map();
	// Store Filenames
	var all_data_src = "data_new/Master_min.csv",
			all_avg_src = "data_new/us_medians_by_year.csv",
			all_county_breaks_src = "data_new/inter_county_class_breaks.csv",
			overall_ranks_src = "data_new/county_ranks_overall.csv",
			us_averages_src = "data_new/us_medians_by_year.csv",
			intra_county_breaks_src = "_intra_county_class_breaks.csv",
			menuitem_src = "menu.json",
			all_cities_src = "topojson_files/cities/cities_wgs84_topo2.json",
			county_dates = "data_new/county_dates.csv",
			labels_src = "topojson_files/labels/labels_topo.json";
	// Menu Item Initialization
	var program_menu = d3.map(),
			excluded_headers = ['STATE', 'COUNTY', 'YEAR', 'ST_CNTY', 'LAT', 'LON'],
			state_names = ['Arizona', 'California', 'Colorado', 'Idaho', 'Montana', 'New Mexico', 'Nevada', 'Oregon', 'Utah', 'Washington', 'Wyoming'];
	// Format
	var formatCurrency = d3.format("$,f"),
			formatPercent = d3.format(".0%");

	var start_year = 1900;
	var menu_title ="";
	var current_selection;

	/* :: HELPER FUNCTIONS :: */
	function arrIsNull(arr) {
			'use strict';
			var joined_arr = arr.join().replace(/,/g, '').length;
			if (+joined_arr >= 0) {
				return false;
			}
			return true;
	}
	function find_by_id(search_obj, id) {
		'use strict';
		// return search_obj.filter(function (item, i, allItems) {
		return search_obj.filter(function (item) {
			return item.id === id;
		})[0];
	}
	function create_layer(data, obj_string, layer_label, layer_class, clickable, disp_opt) {
		'use strict';
		clickable = clickable || false;
		disp_opt = disp_opt || "svg";
		var newLayer = d3.carto.layer.featureArray();

		newLayer
			.features(topojson.feature(data, data.objects[obj_string]).features)
			.renderMode(disp_opt);

		if (layer_label !== null) { newLayer.label(layer_label); }
		if (layer_class !== null) { newLayer.cssClass(layer_class); }
		if (clickable !== null) { newLayer.clickableFeatures(clickable); }

		return newLayer;
	}
	function get_class_break(curr_obj) {
		'use strict';
		var rate_value = curr_obj[current_category];

		if (rate_value === "-999") {
			return "not_eligible";	// not_eligible : defined as "-999" in data
		} if (rate_value === undefined || rate_value === "" || rate_value === "NA" ) {
			return "no_data";				// no_data : defined as ""  in data (null) or not present
		} if (rate_value === "0") {
			return "no_funding";
		}

		rate_value = +rate_value;	//get the integer value of the current rate_value

		if (manualBreaksById.get([current_payments_map, current_category])) {
			// MANUAL BREAKS -- Determined by the data tables in assets/data/*
			var breaks = manualBreaksById.get([current_payments_map, current_category]);
			var i, break_cat;

			// selects the number of categories based on inter- vs intra- county comparison map
			if (current_payments_map === intra_county.header) {
				// for intra county class breaks we need an extra step to get to the breaks data for the county
				breaks = breaks._[curr_obj.ST_CNTY];
				num_categories = intra_county.num_categories;
			} else {
				num_categories = inter_county.num_categories;
			}

			// loops through break categories to compare to the curr_obj's rate_value
			for (i = num_categories-1; i >= 0; i -= 1) {
				// calculates break category (dependent on inter- vs intra- county comparison)
				if (current_payments_map === inter_county.header) {
					break_cat = (i) * (100 / num_categories);
				} else {
					break_cat = Math.floor((i) * (100 / (num_categories)));
				}
				// compare rate_value of curr_obj to break category
				if (rate_value >= +breaks[break_cat]) {
					return "q" + i + "-" + num_categories;
				}
			}
			// Takes care of zero cases (for inter_county the lowest category is "zero" for a light gray style and for intra_county it is q0-# for the darkest blue)
			if (current_payments_map === inter_county.header) {
				return "zero";
			} else {
				return "q0-" + num_categories;
			}
		}

		// Else -- Manual Breaks Not Specified
		// CALCULATED BREAKS
		// TODO: Work on efficiency -- function found in `calc_functions.js`
		var rank = percentrank(data[current_category], +rate_value);
		if (rank === "#N/A" || rank === "NA") {
			return "not_eligible";
		}
		var class_num = Math.floor(num_categories * rank);
		return "q" + class_num + "-" + num_categories;

	}
	function get_tick_breaks(dataset) {
		'use strict';
		var max_data = +dataset['100'],
				i;
		var data_ticks = [];
		for (i = 1; i < max_data; i *= 100) {
			data_ticks.push((max_data / i).toPrecision(2));
		}
		return data_ticks;
	}
	function getNum(currentValue, index, array) {
		'use strict';
		if (!currentValue && !array) { console.error("No Value for getNum(" + currentValue + ", " + index + ", " + array + ")"); }
		var cx = index + min_year, cy;
		if(rateById.get([current_selection, cx]) === undefined){
			cy = 0;
		} else {
			cy = rateById.get([current_selection, cx])[current_category] || 0;
		}

		return {cx: cx, cy: cy};
	}
	function destroy_maptip() {
				//$("#maptip").alert('close');
				d3.selectAll("#maptip").remove()
	}

	function update_maptip(){
	    d3.selectAll("#maptip").remove()

	    if(current_year<start_year){
	   		create_maptip(menu_title + " payment data begins in " + start_year);
	    }else{
	 	   destroy_maptip();
	    }
	}

	function create_maptip(text) {
					destroy_maptip();
		maptip = d3.select("#map").append("div")
			.attr("id", "maptip")
			.attr("height", "500px")
			.attr("class", "alert alert-info alert-dismissible fade in out")
			.attr("role","alert")
		var maptip_text = maptip.append("div")
			.attr("class", "tooltext")
			.text(text);
	}

	function timesliderCallback(timeslider) {
		'use strict';
		current_year = timeslider.value();
		update_year();
		generateUrl();
	}

	/* :: UPDATING FUNCTIONS :: */
	function update_counties() {
		'use strict';
		update_maptip();
		d3.selectAll("g.wc")
			.selectAll("path")
			.attr("class", function (d) {
				var new_class_def = "wc";
				var curr_obj = rateById.get([d.id, current_year]);
				if (curr_obj) {
					var class_break = get_class_break(curr_obj);
					new_class_def += " " + class_break;
				}else {
					new_class_def += " no_data";
				}
				return new_class_def;
			});
	}
	function update_chart() {
		'use strict';

		// Remove everything from display
		d3.selectAll("#linechart_legend > *").remove();
		d3.selectAll("#linechart_svg > *").remove();

		// Set Up Chart
		var data_title = "Payment History";
		var data_label = "Select A County";
		var data_sublabel = "To View Data";

		var data_ticks = get_tick_breaks(manualBreaksById.get([inter_county.header, current_category]));
		var data_max = manualBreaksById.get([inter_county.header, current_category])['100'];

		var ticksize = 5;

		// Set Up Scales for Line Graph
		var xScale = d3.scale.linear()
			.domain([min_year, max_year + 2])
			.range([graph_padding, (centerbar_width + prog_descr_width + 50)]);
		var yScale = d3.scale.log()
			.clamp(true)
			.domain([1, data_max])
			.range([chart_height - graph_padding + 25, 10]);

		//Set Up Brush (if brush is not defined)
		var brush = d3.svg.brush()
			            .x(xScale)
			            .extent([current_year-0.05, current_year+0.05])
			            .on("brush", brushed);

		//Define X axis
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(d3.format("4d"))
			.tickSize(ticksize);

		//Define Y axis
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.tickValues(data_ticks)
			.tickFormat(d3.format("$1s"))
			.tickSize(ticksize);

		// Add X axis to Linechart
		linechart_svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (chart_height - graph_padding + 25) + ")")
			.attr("stroke-width", '1px')
			.call(xAxis);

		// Add Y axis to Linechart
		linechart_svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + graph_padding + ",0)")
			.attr("stroke-width", '1px')
			.call(yAxis);

		//Define Averages Line Object
		var avg_line = d3.svg.line()
			.x(function (d) { return xScale(d.YEAR); })
			.y(function (d) {
				if (!d[current_category] || d[current_category] === "NA") {
					return yScale(0);
				}
				return yScale(d[current_category]);
			})
			.defined(function (d) { if(d[current_category] == "-999") return false;
				return !isNaN(d[current_category]);});

		// Add Line Graph for Averages
		linechart_svg.append("path")
			.datum(averagesByYear)
				.attr("class", "line")
				.attr("d", avg_line)
				.attr("fill", "none")
				.attr("stroke", average_colour)
				.attr("stroke-width", '1.25px'); //A9A9A9

		// Add relevant average point
		linechart_svg.append("circle")
			.attr("id", "average_circle")
			.attr("cx", function () {
				return xScale(current_year);
			})
			.attr("cy", function () {
				if (!averagesByYear[current_year - min_year] || !averagesByYear[current_year - min_year][current_category] ||
						averagesByYear[current_year - min_year][current_category] === "NA") {
					return yScale(0);
				}
				return yScale(averagesByYear[current_year - min_year][current_category]);
			})
			.attr("r", 3)
			.attr("stroke-width", 1.5)
			.attr("stroke", average_colour)
			.attr("fill", background_colour);



		var linechart_legend = d3.select("#linechart_legend");
		// Checks to see if url query exists. If so, selects that county and deletes the queries from the url.
		if (getQueryVariable("kt") == "true" || (getQueryVariable("county") != "undefined" && getQueryVariable("county") != "" && current_selection == undefined)) {
			var current_county = getQueryVariable("county").split("%20").join("_");
				var county_id = "#" + current_county;
			d3.select(county_id);

		d3.selectAll('.selected').classed('selected', false);
				d3.select(county_id).classed('selected', true);
				d3.select(county_id).selectAll('path').classed('selected', true);

				d3.selectAll(county_id)
					.classed('selected', true)
					.selectAll('path')
						.classed('selected', true);
						start_year = program_menu.get(current_category).start_year;
		}


		// Checks if there's a selected county
		if (d3.select('.wc_highlight.selected')[0][0]) {
			current_selection = d3.select('.wc_highlight.selected')[0][0].id;
			var data = rateById.get([current_selection, current_year]);
			if (!data) {
				var nameparts = current_selection.split('_');
				var name = nameparts[0] + '_';
				for (var i = 1; i < nameparts.length; i++ ) {
						var namepart = nameparts[i] + ' ';
						name += namepart;
				}
					current_selection = name.substring(0, name.length - 1);
					data = rateById.get([current_selection, current_year]);

					//for new mexico
					if (data == undefined) {
						current_selection = d3.select('.wc_highlight.selected')[0][0].id;
						nameparts = current_selection.split('_');
						name = nameparts[0] + ' ' + nameparts[1] + '_';
						for (var i = 2; i < nameparts.length; i++ ) {
							namepart = nameparts[i] + ' ';
							name += namepart;
						}

						current_selection = name.substring(0, name.length - 1);
						data = rateById.get([current_selection, current_year]);
					}
				}



			if (data) {
				// If County Is Selected & Available Add to Chart
				var event_label = current_selection + " " + current_category;
				ga('send', 'event', 'Selection', 'selected', event_label);
				var stcnty=data.ST_CNTY;
				data_title = stcnty.split("_")[1] + " County Payment History";
				data_label = stcnty.split("_")[1] + " County";
				//data_sublabel = data.STATE;
				data_sublabel=stcnty.split("_")[0];
				//alert(str.split(data.ST_CNTY,"_")[1]);

				var curr_pt = {cx: current_year, cy: data[current_category]};
				var dataset = Array.apply(null, {length: max_year - min_year + 1}).map(getNum);

				// Set Up Data Summary
				var max_payment = 0;
				var max_payment_year = 1900;

				var percentile = ranksByCounty.get(current_selection)[current_category];
				var established_date = +countyStartYear.get(current_selection)["ESTABLISHED_DATE"];
				var established_text = countyStartYear.get(current_selection)["TEXT"];
				dataset.forEach(function (d) {
					if (+d.cy > max_payment) {
						max_payment = d.cy;
						max_payment_year = d.cx;
					}
				});

				var data_summary="";

				if (established_date > 1906) {
					data_summary = "<strong>" + data_label + "</strong> (established in "+established_date+")";
				}else{
					data_summary = "<strong>" + data_label + "</strong>";
				}


				if(percentile !== undefined && percentile !== null && percentile !== '-') {
					data_summary += " ranks "+
													percentile + " counties historically for this program.<br>"
													data_summary+="It received its maximum payment in <strong>" + max_payment_year + "</strong> of " + formatCurrency(max_payment)+".";

				}else {

					if (established_date > 1906) {
						data_summary = "<strong>" + data_label + "</strong> (established in "+established_date+") has never received any funding from this program."

					}else{
						data_summary = "<strong>" + data_label + "</strong>" + " has never received any funding from this program."

					}

					//+ program_menu.get(current_category).program_title + " Program";
				}




				d3.select("#linechart_summary")
					.html(data_summary);

				//Define Current Data Line Object
				var line = d3.svg.line()
					.x(function (d) { return xScale(d.cx); })
					.y(function (d) { return yScale(d.cy); })
					.defined(function (d) {
						if(d.cy == "-999") {return false;}
						if(d.cx <= established_date) {return false;}
						return !isNaN(d.cy);
					});

				if (!countyStartYear.get(current_selection)["DATA_ALIAS"] == "") {
					var orig_selection = current_selection;
					current_selection = countyStartYear.get(orig_selection)["DATA_ALIAS"];

					var alias_dataset = Array.apply(null, {length: max_year - min_year + 1}).map(getNum);
					var alias_line = d3.svg.line()
						.x(function (d) { return xScale(d.cx); })
						.y(function (d) { return yScale(d.cy); })
						.defined(function (d) {
							if(d.cy == "-999") {return false;}
							if(d.cx > established_date) {return false;}
							//turning off the line feature because we don't want to display fake data
							if(d.cx < established_date) {return false;}
							return !isNaN(d.cy);
						});

							// add pre line graph
							linechart_svg.append("path")
								.datum(alias_dataset)
								.attr("class", "line")
								.attr("d", alias_line)
								.attr("fill", "none")
								.attr("stroke", county_line_colour)
								.attr("stroke-width", '1.25px');


				}

				// Add Line Graph For Current Data
				linechart_svg.append("path")
					.datum(dataset)
					.attr("class", "line")
					.attr("d", line)
					.attr("fill", "none")
					.attr("stroke", county_line_colour)
					.attr("stroke-width", '1.25px');

				// Add relevant point

						linechart_svg.append("circle")
							.attr("id", "active_circle")
							.attr("cx", function () {	return xScale(curr_pt.cx);	})
							.attr("cy", function () {if (curr_pt.cy != -999 && curr_pt.cy != "NA") {
																				return yScale(curr_pt.cy);
																			} else {
																				return 0;
																			} })
							.attr("r", 3)
							.attr("stroke-width", 1.5)
							.attr("stroke", function () {if (curr_pt.cy != -999 && curr_pt.cy != "NA") {
																							return county_line_colour;
																						} else {
																							return background_colour;
																						} })
							.attr("fill", background_colour);


					// established date line
						linechart_svg.append("line")
							.attr("x1", xScale(established_date))
							.attr("y1", yScale(0))
							.attr("x2", xScale(established_date))
							.attr("y2", yScale(data_max))
							.attr("stroke-width", function () {
								if (established_date < 1906) {return 0;}
								if (established_date < start_year) {return 0;}
								return 2;
						})
							.style("stroke-dasharray", ("2, 2"))
							.attr("stroke", "rgb(243, 131, 71)");
					// program creation line
					linechart_svg.append("line")
						.attr("x1", xScale(start_year))
						.attr("y1", yScale(0))
						.attr("x2", xScale(start_year))
						.attr("y2", yScale(data_max))
						.attr("stroke-width", function () {
							if (start_year < "1906") {return 0;}

							return 1;
					})
						.attr("stroke", "gray");

				var dataPt = [xScale(curr_pt.cx), yScale(curr_pt.cy)]
					.map(function (d) { return parseInt(d, 10); });

				var charttip_text = "<div class='tooltext'>" + current_year + ": ";
				if (curr_pt.cy == -999) {
					charttip_text += "not eligible";
				} else if(curr_pt.cy == "NA") {
					charttip_text += "no data";
				}else if(current_year<established_date){
				    charttip_text += formatCurrency(curr_pt.cy)+"*";
				}else{
					charttip_text += formatCurrency(curr_pt.cy);
				}
				charttip_text += "</div>" + "<div class='arrow-down center'></div>";

				if (isNaN(dataPt[1])) {
					dataPt[1] = 150;
				}

				charttip
					.classed("hidden", false)
					.html(charttip_text)
					.attr("style", function () {
						if ($("#charttip").height() > 45) {return "left:" + (dataPt[0] - 9) + "px;top:" + (dataPt[1] - 53) + "px";}
						return "left:" + (dataPt[0] - 9) + "px;top:" + (dataPt[1] - 38) + "px";
					});


				var establishedtip_text = "<div class='established_text_label'>*" + established_text + "</div>";
				establishedtip
					.classed("hidden", function () {
						if (established_date < 1906 ) {return true;}
						if (established_date < start_year ) {return true;}
						//if (established_date > 1935 && start_year < established_date && start_year > (established_date - 20)) {return true;}
			//			if (established_date < 1935 && start_year > established_date && start_year < (established_date + 20)) {return true;}
						return false;
					})
					.html(establishedtip_text)
					.attr("style", function () {
						if (established_date < 1935) {return "left:" + (xScale(established_date) + 3) + "px;top:" + (yScale(data_max)) + "px";}
						return "left:" + (xScale(established_date) - 184) + "px;top:" + (yScale(data_max)) + "px";
					})

					.style("color", "rgb(243, 131, 71)")
					.style("font-family", "'Avenir', 'lato', helvetica, sans-serif;")
					.style("font-size", "12px")
					.style("line-height", "125%")
					.style("width", "180px")
					.style("position", "absolute")
					.style("pointer-events", "none")
					.style("paint-order","stroke")
   					.style("stroke","#FFF")
    				.style("stroke-width","2px")

					.style("text-align", function () {
							if (established_date < 1935) {return "left";}
							return "right";
					});



					var programtip_text = "<div class='established_text_label'>" + "Program created in " + start_year + "</div>";
					programtip
						.classed("hidden", function () {
							if (start_year < 1910) {return true;}
							return false;
						})
						.html(programtip_text)
						.attr("style", function () {
							return "left:" + (xScale(start_year) - 65) + "px;top:" + 100 + "px";
						})
						.style("color", "gray")
						.style("font-family", "'Avenir', 'lato', helvetica, sans-serif;")
						.style("font-size", "12px")
						.style("line-height", "125%")
						.style("width", "60px")
						.style("position", "absolute")
						.style("pointer-events", "none")
						.style("text-align", "right");


				var current_legend_label = linechart_legend.append("div")
					.classed("current_legend_label", true);
					current_legend_label
						.append("div")
						.classed("legend_line", true)
						.style("background-color", county_line_colour);
					current_legend_label
						.append("div")
						.classed("legend_label", true)
						.text(data_label);
					current_legend_label
						.append("div")
						.classed("", true)
						.text(data_sublabel);
			}
		}

		d3.selectAll("#linechart_title")
			.text(data_title);

		var all_counties_legend_label = linechart_legend.append("div")
			.classed("all_counties_legend_label", true);
			all_counties_legend_label
				.append("div")
				.classed("legend_line", true)
				.style("background-color", average_colour);
			all_counties_legend_label
				.append("div")
				.classed("legend_label", true)
				.html("Western States");
			all_counties_legend_label
				.append("div")
				.classed("", true)
				.html("Median of Counties<br>Receiving Funds");

		var chart_brush = linechart_svg.append('g')
			.attr('class', 'brush')
			.call(brush)
			.on("mouseup", brush_select)
			.selectAll("rect")
				.attr("height", chart_height)
				.on('hover', function(d) {

				});

		function brushed() {
      var ext_0 = brush.extent(),
		      ext_1,
					curr_brush = this,
		      d0 = Math.round(xScale.invert(d3.mouse(curr_brush)[0]));//Math.round(ext_0[1]),
      // d1 = d0 + 1; //Math.offset(d0, Math.round((ext_0[1] - ext_0[0]) / 864e5));
			var update = false;
			if(d0 < min_year) {
        d0 = min_year;
        update = true;
      } else if (d0 > max_year) {
        d0 = max_year;
				update = true;
      }
      ext_1 = [d0 - 0.05, d0 + 0.05];
			if(update) {brush_select(true);}

			// setting as hidden:true until complete fix
			brushtip
				.classed("hidden", true)
				.attr("style", "left:" + (xScale(d0) - 9) + "px;top:" + (chart_height/2) + "px")
				.html("<div class='tooltext'>" + d0 + ": " + ext_1 + "</div>" + "<div class='arrow-down center'></div>");

			d3.select(curr_brush).call(brush.extent(ext_1));
    }

		function brush_select () {
			var d0 = Math.round(brush.extent()[0]); //Math.round(brush.extent()[0]);
			if(d0 < min_year) {
        d0 = min_year;
      } else if (d0 > max_year) {
        d0 = max_year;
      }
			timeslider.value(d0);
			current_year = d0;
			update_year();
			generateUrl();
		}


	}

	function generateUrl() {
		'use strict';
		var url = "http://followthemoney.stanford.edu/index.html?";
		var county = current_selection;
		url += "county" + "=" + county + "&";

		var current_zoomscale = map.zoom().scale();
		var current_zoomtran = map.zoom().translate();

		url += "year" + "=" + current_year + "&";
		url += "program" + "=" + current_category + "&";
		url += "scale" + "=" + current_zoomscale + "&";
		url += "translate" + "=" + current_zoomtran + "&";
		if (getQueryVariable("toggleTrends") == true) url += "toggleTrends=true&";
		history.pushState({}, 'Map', url);
	}

	function mapShift() {
		current_year = getQueryVariable("year");
		var scale = getQueryVariable("scale");
		var translate = (getQueryVariable("translate")).split(',');
		map.zoom().scale(scale).translate(translate);
		map.refresh();
		update_year();
		generateUrl();
		timeslider.value(current_year);
	}


	function update_year() {
		'use strict';

		//Update Year Label
		d3.select("#year")
			.text(current_year);

		// Adjust Previous Year Button
		if (current_year === min_year) {
			d3.select("#prev_btn")
			.attr("disabled", true);
		} else {
			d3.select("#prev_btn")
			.attr("disabled", null);
		}

		//Adjust Next Year Button
		if (current_year === max_year) {
			d3.select("#next_btn")
			.attr("disabled", true);
		} else {
			d3.select("#next_btn")
			.attr("disabled", null);
		}

		update_counties();
		update_chart();
	//	if (getQueryVariable("kt") == "true") {

	//	}
	}
	function update_map_title() {
		'use strict';

		//Set Up Map Title and Switch Button
		// d3.select("#map_title")
		// .html(current_payments_map + "<br>Payments");
	}
	function update_legend() {
		'use strict';

		var legend = d3.select("#legend"),
				breaks = manualBreaksById.get([inter_county.header, current_category]),
				i,
				new_key,
				break_cat,
				break_text,
				color_class;

		d3.selectAll("#legend > *").remove();

		if (current_payments_map === intra_county.header) {
			d3.select("#legend")
				.classed(intra_county.break_class, true)
				.classed(inter_county.break_class, false);
			num_categories = intra_county.num_categories;
		} else {
			d3.select("#legend")
				.classed(intra_county.break_class, false)
				.classed(inter_county.break_class, true);
			num_categories = inter_county.num_categories;
		}

		for (i = num_categories; i >= 0; i--) {
			if (current_payments_map === inter_county.header) {
				break_cat = i * (100 / num_categories);
				break_text = formatCurrency(breaks[break_cat]);
			} else {
				break_cat = (i-1) * (100 / (num_categories-1));
				break_text = intra_county.break_labels[i];
			}
			color_class = "q" + i + "-" + num_categories;

			new_key = legend.append("div")
				.classed("min_height", true)
				.classed("legend_key", true);
			new_key.append("div")
				.classed(color_class, true)
				.classed("legend_color", i !== num_categories)
				.classed("legend_color_null", i === num_categories);
			new_key.append("div")
				.classed("legend_color", i !== num_categories)
				.classed("legend_color_null", i === num_categories);
			new_key.append("div")
				.classed("legend_class",  i !== num_categories)
				.classed("legend_class_null", i === num_categories)
				.attr("height", "200px")
				.text(break_text);
		}

		if (current_payments_map === inter_county.header) {
			new_key = legend.append("div")
				.classed("min_height", true)
				.classed("legend_key", true);

		}
	}
	function update_description(obj) {
		'use strict';
		var active_area = d3.select("#program_description_area .btn-primary");
		var option_value = active_area[0][0].attributes.title.value;

		var program_text = d3.select("#program_description_text");
		program_text.html(obj[option_value]);
		var ktlinks = document.querySelectorAll(".keytrendslink");
		for (var i = 0; i < ktlinks.length; i++) {
				(function (i) {
					var currentElement = ktlinks[i];
					currentElement.addEventListener("click", function(){
						var link = currentElement.id;
						var url = 'http://followthemoney.stanford.edu/index.html' + link + '&kt=true';
						history.pushState({}, 'Map', url);
						mapShift();

						d3.selectAll(".keytrendslink").style("color", "#DE6842");
						currentElement.style.color = "rgb(0,104,55)";
					}
					, false);
				}) (i);
		}

		var extent = d3.select('.extent');
		extent.style("fill-opacity", "0");

	}
	function update_description_title(obj) {
		'use strict';
		var program_descr_area = d3.select("#program_description_area");
		program_descr_area.select('h3').text(obj.program_title);
		update_description(obj);

	}

	/* :: SETUP FUNCTIONS :: */
	function setup_tooltips() {
		// Tooltip instantiation: for tooltips over svgs or spec-features they are instantiated on the underlying divs
		// (this prevents errors and styling issues)

		// tooltip: main tooltip over map area
		tooltip = d3.select("#map_row").append("div")
			.attr("class", "tooltip hidden");

		// menutip: tooltip for menu on hover
		menutip = d3.select("#program_menu").append("div")
			.attr("class", "tooltip hidden");

		// charttip: tooltip over data chart
		charttip = d3.select("#linechart").append("div")
			.attr("id", "charttip")
			.attr("class", "tooltip hidden");

		// establishedtip: text for establishment line
		establishedtip = d3.select("#linechart").append("div")
			.attr("id", "establishedtip")
			.attr("class", "hidden");

		programtip = d3.select("#linechart").append("div")
				.attr("id", "programtip")
				.attr("class", "hidden");

		// brushtip:
		brushtip = d3.select("#linechart").append("div")
			.attr("class", "tooltip hidden");
	}
	function setup_timecontrols() {
		'use strict';
		var time_controls = d3.select("#timeline_controls");
		time_controls.select("#prev_btn")
			.on("click", function () {
				if (current_year > min_year) {
					current_year = current_year * 1 - 1;
					timeslider.value(current_year);
					update_year();
					generateUrl();
				}
			});
		time_controls.select("#next_btn")
			.on("click", function () {
				if (current_year < max_year) {
					current_year = current_year * 1 + 1;
					timeslider.value(current_year);
					update_year();
					generateUrl();
				}
			});

		update_year();
		generateUrl();

		timeslider = slider(min_year, max_year, centerbar_width - graph_padding, min_year, max_year)
			.value(current_year);
		timeslider.callback(function () {
			timesliderCallback(timeslider);
		});
		d3.select("#timeline").append("svg").call(timeslider);
	}
	function setup_programmenu() {
		'use strict';
		// Set Up Menu from data/menu.json
		d3.json("menu.json", function (menudata) {
			menudata.menuitems.forEach(function (d) {
				// Pull menuitems from data/menu.json
				var program_label = d.id;
				program_menu.set(d.id, d);

				// Set up intra-county class breaks for current program
				d3.csv("data_new/intra_county_class_breaks/" +
							d.id + intra_county_breaks_src, function (breaks_data) {
					var map = d3.map();
					breaks_data.forEach(function (d) {
						map.set(d.county, d);
					});
					manualBreaksById.set([intra_county.header, program_label], map);
				});

				// If the menu item is disabled : Sets up disabled class
				var disabled;
				if (d.active) { disabled = null; }
				else { disabled = true; }

				// Sets up the Program Menu (appending the curent menu item)
				d3.select("#program_menu").append("div")
					.text(d.menu_abbrev)

					.attr("id", d.id)
					.attr("program_title", d.program_title)
					.attr("class", "btn")
					.attr("disabled", disabled)

					.classed("btn-primary", current_category === d.id)
					.classed("btn-default", current_category !== d.id)
					.classed("menuitem", true)

					.on('click', function () {

						current_category = this.id;
						d3.selectAll("#program_menu .btn-primary")
							.classed("btn-primary", false)
							.classed("btn-default", true);
						d3.select(this)
							.classed("btn-primary", true)
							.classed("btn-default", false);

						start_year = program_menu.get(current_category).start_year;
						menu_title = program_menu.get(this.id).program_title;
						update_maptip();

						var this_link = "pages/" + d.id + ".html";
						d3.select('#program_description_btn').attr("href", this_link);

						update_counties();
						update_legend();
						update_description_title(program_menu.get(current_category));
						update_chart();
				  	generateUrl();
					})
					.on("mouseenter", function (d) {
						var mouse = d3.mouse(d3.select("#program_menu").node()).map( function(d) { return parseInt(d, 10); } );
						var menu_title = program_menu.get(this.id).program_title;
						menutip
							.classed("hidden", false)
							.attr("style", "left:"+(mouse[0] - 50)+"px;top:"+(mouse[1]+10)+"px")
							.html("<div class='tooltext'>" + menu_title+ "</div>"); // + "<div class='arrow-down center'></div>");
					})
					.on("mouseout",  function() {
						menutip.classed("hidden", true);
					});

			});

			update_description_title(program_menu.get(current_category));
		});

		if (getQueryVariable("toggleTrends") == "true") {
			d3.selectAll("#description_trends_toggle_btn_container > .btn-primary")
				.classed("btn-primary", false)
				.classed("btn-default", true);

			d3.select(this)
				.classed("btn-primary", true)
				.classed("btn-default", false);

			update_description(program_menu.get(current_category));
		}

		d3.selectAll("#description_trends_toggle_btn_container .btn")
			.on("click", function () {
				d3.selectAll("#description_trends_toggle_btn_container > .btn-primary")
					.classed("btn-primary", false)
					.classed("btn-default", true);

				d3.select(this)
					.classed("btn-primary", true)
					.classed("btn-default", false);

				update_description(program_menu.get(current_category));
				if (getQueryVariable("toggleTrends") == "true") {
					generateUrl();
				} else {
					var url = document.URL;
					url += "toggleTrends=true&";
					history.pushState({}, 'Map', url);
				}

			});

	}
	function setup_counties() {
		'use strict';

		county_layer.g().classed(inter_county.break_class, true);

		var counties = d3.selectAll("g.wc")
			.attr("id", function (d) {
				//	var id = d.id;
				var id = d.id.split(' ').join('_');
				//returns state_county with udnerscores in right places
				return id;
			})
			.attr("state", function (d) {
				//returns the state name with underscroes instead of spaces

				return d.id.split('_')[0].split(' ').join('_');
			//		return d.id.split('_')[0];
			});

		path = d3.geo.path().projection(map.projection());

		d3.selectAll("g.wc_highlight")
			.attr("id", function (d) {
				return d.id.split(' ').join('_');
			//	return d.id;
			})
			.on("mousedown", function () {
				d3.selectAll('.selected').classed('selected', false);
				d3.select(this).classed('selected', true);
				d3.select(this).selectAll('path').classed('selected', true);

				d3.selectAll('#' + this.id.split(' ').join('_'))
					.classed('selected', true)
					.selectAll('path')
						.classed('selected', true);



				update_chart();
				generateUrl();
			})
			.on("mouseenter", function (d) {

					var data = rateById.get([d.id, current_year]) || {};

					var mouse = d3.mouse(d3.select("#d3MapSVG").node()).map( function(d) { return parseInt(d, 10); } );

					if(!data) data.COUNTY = d.county;
					if(!data) data.STATE = d.state;

					tooltip
						.classed("hidden", false)
						.attr("style", "left:"+(mouse[0] - 30)+"px;top:"+(mouse[1] + 20)+"px")
						//.html("<div class='tooltext'>" + (data.COUNTY) + ", " + (data.STATE) + "</div>"); // + "<div class='arrow-down center'></div>");
						.html("<div class='tooltext'>" + (data.ST_CNTY.split("_")[1]) + ", " + (data.ST_CNTY.split("_")[0]) + "</div>"); // + "<div class='arrow-down center'></div>");
			})
			.on("mouseout",  function() {
				tooltip.classed("hidden", true);
			});



		update_counties();
	}
	function setup_background() {
		d3.selectAll("g.country_background")
			.attr("filter", "url(#dropshadow)");
	}
	function setup_states_and_cities() {
		d3.selectAll("g.label_marker")
			.classed("state", function(d) {
				var cat = labelData.get(d.id).category;
				return (cat === "state");
			})

			.classed("city", function(d) {
				var cat = labelData.get(d.id).category;
				return (cat === "city");
			})
			.classed("centered", function(d) {
				var cat = "centered"
				var cate = labelData.get(d.id).id;
				if(cate=="Portland" | cate=="Salt Lake City"){
					return (cat === "centered");
				}
			})


			.append("text")
		    .text(function(d) {
					return d.id;
				});

		d3.selectAll("g.label_marker.state text")
			.attr("font-size","14px")
			.attr("text-anchor", "middle")
			.attr("fill", "rgb(25, 25, 25)")
			.attr("stroke", "none")
			.attr("dy", ".7em")
			.style("pointer-events", "none");

		d3.selectAll("g.label_marker.city text")
			.attr("font-size","14px")
			.attr("dx", "2.5px")
			.attr("dy", "13px")
			.attr("fill", "rgb(40, 40, 40)")
			.style("pointer-events", "none");

		d3.selectAll("g.label_marker.centered text")
			.attr("font-size","14px")
			.attr("text-anchor", "middle")
			.attr("dx", "4px")
			.attr("dy", "14px")
			.attr("fill", "rgb(40, 40, 40)")
			.style("pointer-events", "none");

    d3.selectAll("g.label_marker.state circle.label_marker").remove();
    map.refresh();
	}

	function setup_map_layers() {
		'use strict';

		// USA BACKGROUND
		usa_background_layer = create_layer(data.usa_background, "usa_back_wgs84_geo",
		"Background", "country_background", false, "svg")
			.on("load", setup_background);
		// USA BORDER
			// usa_border_layer = create_layer(data.usa_borders, "usa_b_wgs84_geo",
			// "Borders", "country_border", false);
		usa_foreground_layer = create_layer(data.usa_background, "usa_back_wgs84_geo",
		"Borders", "country_foreground", false, "svg");
		// OTHER STATES
		other_state_layer = create_layer(data.other_states_borders, "osb_wgs84_geo",
		"Other States", "other_state", false, "svg");
		// OTHER COUNTRIES BORDERS
		other_countries_layer = create_layer(data.other_countries_borders, "ocb_wgs84_geo",
		"Other Countries", "light_border", false);
		// HIGHLIGHTED STATES BORDERS
		highlighted_state_layer = create_layer(data.highlighted_states, "hsb_wgs84_geo",
		"Highlighted States", "state", false);
		// COUNTY LAYER
		county_layer = create_layer(data.wc, "wc_wgs84_geo", "Counties", "wc", true);
		// COUNTY-HIGHLIGHT LAYER
		county_highlight_layer = create_layer(data.wc, "wc_wgs84_geo", "Counties", "wc_highlight", true)
			.on("load", setup_counties);

		var labelGeoms = data.labels.objects.labels_geo.geometries;

		var x;
		for (x in labelGeoms) {
      var center = d3.geo.centroid(labelGeoms[x]);
      var newPoint = {label: labelGeoms[x].id, x: center[0], y: center[1]};
      labelData.set(labelGeoms[x].id, labelGeoms[x]);
    }

		labels_layer = d3.carto.layer.xyArray();
		labels_layer
	    .features(topojson.feature(data.labels, data.labels.objects.labels_geo).features)
	    .label("Labels")
	    .cssClass("label_marker")
	    .renderMode("svg")
	    .x(function (d) {
				return d.geometry.coordinates[0];
			})
	    .y(function (d) {
				return d.geometry.coordinates[1];
			})
	    .markerSize(2)
	    .clickableFeatures(false)
			.on("load", setup_states_and_cities);
	}
	function add_map_layers() {
		/* Layers Added to the Map -- Order Matters
		* Layers are added to the visible map in the order they are added here. First on the bottom, Last on the top
		*/
		'use strict';

		map.addCartoLayer(usa_background_layer);
		map.addCartoLayer(other_countries_layer);
		map.addCartoLayer(usa_foreground_layer);

		map.addCartoLayer(other_state_layer);
		map.addCartoLayer(county_layer);
		map.addCartoLayer(highlighted_state_layer);

		map.addCartoLayer(county_highlight_layer);
		// map.addCartoLayer(cities_layer);
		map.addCartoLayer(labels_layer);


	}

	function setup_carto_map() {
		'use strict';
		// Using Albers Projection
		projection = d3.geo.albers()
			.center([3, 25]);

		// Initialize carto map
		map = d3.carto.map();
		d3.selectAll("#map > .circle").remove();
		d3.selectAll("#map > .circle1").remove();
		d3.select("#map").call(map);

		// Map uses the Albers Projection Defined Above
		map.mode("projection");
		map.projection(projection);

		map.zoom()
			.scale(1800)
		    .scaleExtent([1800,10000]);
		map.centerOn([-0.27, -0.04], 'scaled');

		if (getQueryVariable("scale") != "") {
			var scale = getQueryVariable("scale");
			var translate = (getQueryVariable("translate")).split(',');
			map.zoom().scale(scale).translate(translate);
		}

		var map_svg = d3.select('#d3MapSVG');
		var filter = map_svg.append("defs")
			.append("filter")
				.attr("id", "dropshadow");
		filter
			.append("feGaussianBlur")
				.attr("in", "SourceAlpha")
				.attr("stdDeviation", 5);

	}
	function setup_map(err, queued_data) {
		'use strict';
		// Check for Errors -- Print to console.error
		if (err) {
			console.error(err);
			return;
		}

		// Get Data from queued data
		data.wc = queued_data[0];
		data.usa_background = queued_data[1];
		data.usa_borders = queued_data[2];
		data.other_states_borders = queued_data[3];
		data.other_countries_borders = queued_data[4];
		data.highlighted_states = queued_data[5];
		data.labels = queued_data[6];
		// data.labels = queued_data[7];

		setup_carto_map();
		setup_map_layers();
		add_map_layers(data.all_data);

		setup_timecontrols();
		update_legend();
	}
	function setup_data(d) {
			var state_county_label = 'ST_CNTY';
			var year_label = 'YEAR';
			var key = [d[state_county_label], d[year_label]];
			rateById.set(key, d);
			if (d[current_category] !== "") {
				if (+d[current_category] !== 0 || d[current_category].indexOf(0) === -1) {
					data[current_category].push(+d[current_category]);
				}
			}
			if (+d[year_label] > max_year) {
				max_year = +d[year_label];
			} else if (+d[year_label] < min_year) {
				min_year = +d[year_label];
			}
	}
	/* :: INIT/QUEUE FUNCTION :: */
	function queue_data() {
		'use strict';

		//Set up and Queue data
		var q = queue(1);
		q
			//.defer(d3.json, "topojson_files/Western_Counties_sm/wc_wgs84_topo.json")
			.defer(d3.json, "topojson_files/Western_Counties_sm/wc_wgs84_topo2.json")
			.defer(d3.json, "topojson_files/USA_background/usa_back_wgs84_topo.json")
			.defer(d3.json, "topojson_files/USA_borders/usa_b_wgs84_topo.json")
			.defer(d3.json, "topojson_files/other_states_borders/osb_wgs84_topo.json")
			.defer(d3.json, "topojson_files/other_countries_background/ocb_wgs84_topo.json")
			.defer(d3.json, "topojson_files/highlighted_states_borders/hsb_wgs84_topo.json")
			// .defer(d3.json, all_cities_src)
			.defer(d3.json, labels_src)
			.defer(d3.csv, all_data_src, setup_data)
			.defer(d3.csv, all_county_breaks_src, function (d) {
				var program_label = 'Program';
				manualBreaksById.set([inter_county.header, d[program_label]], d);
			})
			.defer(d3.csv, us_averages_src, function (d) {
				averagesByYear.push(d);
			})
			.defer(d3.csv, overall_ranks_src, function (d) {
				ranksByCounty.set(d.county, d);
			})
			.defer(d3.csv, county_dates, function (d) {
				countyStartYear.set(d.ST_CNTY, d);
			});

		q.awaitAll(setup_map);
	}

	// inspired by https://css-tricks.com/snippets/javascript/get-url-variables/
	function getQueryVariable(variable)	{
	       var query = window.location.search.substring(1);
	       var vars = query.split("&");

	       for (var i = 0; i < vars.length; i++) {
	       		var selection = vars[i].split("=");
	       		if(selection[0] == variable){return selection[1];}
	       }

	       return("");
	}

	function makeTranslateArray(input) {
		var array = input.split(",");
	}

	function init_data() {
		'use strict';

		if (getQueryVariable("year") != "") {
		current_year = getQueryVariable("year");
		min_year = 1906;
		update_maptip();
	}	else {
		current_year = 1978;
		min_year = current_year;
	}
		max_year = current_year;


		if (getQueryVariable("program") != "") {
					current_category = getQueryVariable("program");
			}	else {
				current_category = "PILT";
			}

		num_categories = 5;
		data[current_category] = [];
		current_payments_map = inter_county.header;


		d3.select("#map_toggle_btn")
		// .html("Switch to<br>" + intra_county.header + " Map")
			.on("click", function () {
				if (current_payments_map === inter_county.header) {
					// d3.select(this)
					// .html("Switch to<br>" + inter_county.header + " Map");
					// d3.select(this).classed('active', null);
					d3.select(this).select("#map_toggle_box").classed('active', true);
					current_payments_map = intra_county.header;
					county_layer.g().classed(inter_county.break_class, false);
					county_layer.g().classed(intra_county.break_class, true);
				} else {
					// d3.select(this)
					// .html("Switch to<br>" + intra_county.header + " Map");
					// d3.select(this).classed('active', true);
					d3.select(this).select("#map_toggle_box").classed('active', null);
					current_payments_map = inter_county.header;
					county_layer.g().classed(intra_county.break_class, false);
					county_layer.g().classed(inter_county.break_class, true);
				}

				update_map_title();
				update_legend();
				update_counties();

			});

		linechart_svg = d3.select("#linechart").append('svg')
			.attr("id", "linechart_svg")
			.on("mouseover", function(d) {

			});

		setup_tooltips();
		setup_programmenu();
		update_map_title();
	//	document.getElementById("mapshare_btn").addEventListener("click", generateUrl, false);

		var this_link = "pages/" + current_category + ".html";
		d3.select('#program_description_btn').attr("href", this_link);
	}

	/* :: CALL FUNCTIONS :: */
	init_data();
	queue_data();
	// when back button detected, shift to previous location on map
	window.onpopstate = function(event) {
		current_year = getQueryVariable("year");
		var scale = getQueryVariable("scale");
		var translate = (getQueryVariable("translate")).split(',');
		map.zoom().scale(scale).translate(translate);
		map.refresh();
		var current_county = getQueryVariable("county").split("%20").join("_");
			var county_id = "#" + current_county;
		d3.select(county_id);

	d3.selectAll('.selected').classed('selected', false);
			d3.select(county_id).classed('selected', true);
			d3.select(county_id).selectAll('path').classed('selected', true);

			d3.selectAll(county_id)
				.classed('selected', true)
				.selectAll('path')
					.classed('selected', true);
					start_year = program_menu.get(current_category).start_year;
		update_year();
		timeslider.value(current_year);
	}

})();
