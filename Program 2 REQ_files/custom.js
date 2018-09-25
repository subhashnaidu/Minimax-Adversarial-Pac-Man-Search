
//Adding MIT licensed jquery plugin for binding-first
// https://github.com/private-face/jquery.bind-first/blob/master/dev/jquery.bind-first.js


(function($) {
	var splitVersion = $.fn.jquery.split(".");
	var major = parseInt(splitVersion[0]);
	var minor = parseInt(splitVersion[1]);
	var JQ_LT_17 = (major < 1) || (major == 1 && minor < 7);

	function eventsData($el) {
		return JQ_LT_17 ? $el.data('events') : $._data($el[0]).events;
	}

	function moveHandlerToTop($el, eventName, isDelegated) {
		var data = eventsData($el);
		var events = data[eventName];

		if (!JQ_LT_17) {
			var handler = isDelegated ? events.splice(events.delegateCount - 1, 1)[0] : events.pop();
			events.splice(isDelegated ? 0 : (events.delegateCount || 0), 0, handler);

			return;
		}

		if (isDelegated) {
			data.live.unshift(data.live.pop());
		} else {
			events.unshift(events.pop());
		}
	}

	function moveEventHandlers($elems, eventsString, isDelegate) {
		var events = eventsString.split(/\s+/);
		$elems.each(function() {
			for (var i = 0; i < events.length; ++i) {
				var pureEventName = $.trim(events[i]).match(/[^\.]+/i)[0];
				moveHandlerToTop($(this), pureEventName, isDelegate);
			}
		});
	}

	function makeMethod(methodName) {
		$.fn[methodName + 'First'] = function() {
			var args = $.makeArray(arguments);
			var eventsString = args.shift();

			if (eventsString) {
				$.fn[methodName].apply(this, arguments);
				moveEventHandlers(this, eventsString);
			}

			return this;
		};
	}

	// bind
	makeMethod('bind');
	// one
	makeMethod('one');

	// delegate
	$.fn.delegateFirst = function() {
		var args = $.makeArray(arguments);
		var eventsString = args[1];

		if (eventsString) {
			args.splice(0, 2);
			$.fn.delegate.apply(this, arguments);
			moveEventHandlers(this, eventsString, true);
		}

		return this;
	};

	// live
	$.fn.liveFirst = function() {
		var args = $.makeArray(arguments);

		// live = delegate to the document
		args.unshift(this.selector);
		$.fn.delegateFirst.apply($(document), args);

		return this;
	};

	// on (jquery >= 1.7)
	if (!JQ_LT_17) {
		$.fn.onFirst = function(types, selector) {
			var $el = $(this);
			var isDelegated = typeof selector === 'string';

			$.fn.on.apply($el, arguments);

			// events map
			if (typeof types === 'object') {
				for (type in types)
					if (types.hasOwnProperty(type)) {
						moveEventHandlers($el, type, isDelegated);
					}
				} else if (typeof types === 'string') {
					moveEventHandlers($el, types, isDelegated);
				}

				return $el;
			};
		}

	})(jQuery);


$(document).ready(function(){
	// Initialize accordions if they exist
	accordionToggle();
	
	// Make all fields on the Course Details page the same width as the Language dropdown
	onPage(/\/courses\/[0-9]+\/settings/, function(el){
		$('.coursesettings #course_name, .coursesettings #course_course_code, .coursesettings #course_sis_source_id, .coursesettings #course_account_id_lookup').css('width', '343px');
		$('.coursesettings #course_time_zone, .coursesettings #course_enrollment_term_id').css('width', '360px');
		$('.coursesettings #course_start_at, .coursesettings #course_conclude_at').css('width', '297px');
	});

	// Make the fields on the Section Settings page wider
	onPage(/\/courses\/[0-9]+\/sections\/[0-9]+/, function(el){
		$('.edit_course_section #course_section_name, .edit_course_section #course_section_sis_source_id').css('width', '343px');
		$('.edit_course_section #course_section_start_at, .edit_course_section #course_section_end_at').css('width', '297px');
	});

	// Remove all but privacy policy and terms of service links from footer
	$('#footer-links').html('<a href="/privacy_policy">Privacy policy</a><a href="/terms_of_use">Terms of service</a>');

	// Add popout button
	$("#file_content").after('<div id="popout-btn-container" style="width: 220px; height: 38px; margin: 0 auto -38px auto;"><a id="popout-btn" class="btn" href="'+$("#file_content").attr('src')+'" target="_blank">Open in a New Window</a></div>');
	setTimeout(checkSequenceFooter, 2000);
	if( $(".draft_state_enabled").length > 0 ){
		$('#popout-btn-container').css('marginTop', '0px').css('marginBottom', '-21px');
	}

  // Fix phrasing of adding users to a course

	//The function below checks to see that an element has rendered. When called
	//the function will look for a particular selector. Do not remove.
	function onElementRendered(selector, cb, _attempts) {
		var el = $(selector);
		_attempts = ++_attempts || 1;
		if (el.length) return cb(el);
		if (_attempts == 60) return;
		setTimeout(function() {
			onElementRendered(selector, cb, _attempts);
		}, 250);
	}

	onElementRendered('#addUsers', function() {
		$('#addUsers').on('click', function() {
			if (window.location.pathname.indexOf('courses') > -1) {
				// Hide the "Login ID" on the "Add People" screen on the people page within a course
				$('[for="peoplesearch_radio_cc_path"]').hide();
				// Hide the example text
				$("div.addpeople div>span:contains('Example:')").parent().hide()
				// Select the NID by default
				$('#peoplesearch_radio_unique_id').click();
				// Change the text for "Login ID" and "SIS ID" to "NID" and "UCFID", respectively
				$('[for="peoplesearch_radio_unique_id"] span:nth-child(2)').text('NID');
				$('[for="peoplesearch_radio_sis_user_id"] span:nth-child(2)').text('UCFID');
			}
		});
	});

	//PROCTORHUB CODE
	if (typeof ENV['QUIZ'] !== 'undefined') {
		var PROCTORHUB_DIRECTORY = 'https://proctorhub.cdl.ucf.edu/proctorhub/';
		// var PROCTORHUB_DIRECTORY = 'https://devhub.cdl.ucf.edu/proctorhub/';
		var user_id = ENV['current_user_id'];
		var course_id = ENV['COURSE_ID'];
		if (!course_id){
			course_id = $('.course_id').text();
		}
		var quiz_id = ENV['QUIZ']['id'];
		//listening for child iframe
		var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
		var listen = window[eventMethod];
		var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
		listen(messageEvent, function(e) {
			if(e.data == "removing") {
				sessionStorage.proctoring_object_id = null;
				sessionStorage.clear();
				sessionStorage.webCamActive = 'False';
				$('iframe[id*="webcam_iframe"]').remove();
				$('#stop_webcam').remove();
				$('#display_webcam').remove();
			} else if(e.data == "quiz_id") {
				e.source.postMessage(quiz_id,"*");
			} else if(e.data == "loaded") {
				$("#not_loaded").remove();
				// change not loaded text to recording
			} else {
				// other data
			}
		}, false);

		//confirm that they're a student
		if(ENV['current_user_roles'].indexOf('student') > -1) {
			if($("#session_button").length > 0) {

				//if a proctored quiz is being resumed
				if($(".btn.btn-primary:contains('Resume Quiz')").text() !== "") {

					$(".btn.btn-primary:contains('Resume Quiz')").text("Resume Proctored Exam");
					$(".btn.btn-primary:contains('Resume Proctored Exam')").css({
						"vertical-align": "middle",
						"font-size": "17px",
						"line-height": "1"
					});
				}

				$("a#take_quiz_link").text("Take Proctored Exam");
				$("a#take_quiz_link").css({
					"vertical-align": "middle",
					"font-size": "17px",
					"line-height": "1"
				});

				//check to see if they're taking it
				var url = window.location.href;
				var taking_quiz_regex = new RegExp("quizzes/[0-9]+/take");
				var quiz_regex = new RegExp("quizzes/[0-9]+");


				//if actively taking test
				if(taking_quiz_regex.test(url)) {

					var proctoring_object_id = 0;

					//check if there is already a session
					if (sessionStorage.proctoring_object_id) {
						proctoring_object_id = sessionStorage.proctoring_object_id;
					}

					//if webcam not already active
					if($("#webcam_iframe").length < 1) {
						sessionStorage.webCamActive = 'True';
						//object id
						sessionStorage.proctoring_object_id = ENV['QUIZ']['id'];
						var stopWebcamText = "<div style='text-align: center; margin: 8px;'><a href='#' id='stop_webcam'>Stop Webcam</a></div>";
						var iframe = '<iframe id="webcam_iframe" title="ProctorHub" scrolling="no" allow="camera; microphone" width="260" height="335" style="border: 0 none;" src="' + PROCTORHUB_DIRECTORY + 'core/webcam/?user_id=' + user_id + '&course_id=' + course_id + '&quiz_id=' + quiz_id + '&proctoring_object_id=' + proctoring_object_id + '" />';
						var hideShowText = "<div style='text-align: center; margin: 3px;'><button class='btn btn-primary quiz-publish-button' id='display_webcam'>Hide Webcam</button></div>";
						$('#right-side').append(iframe).append(hideShowText).append(stopWebcamText);
					}

				} else if(quiz_regex.test(url)) {

					if($("#webcam_iframe").length < 1) {

						var stopWebcamText = "<div style='text-align: center; margin: 8px;'><a href='#' id='stop_webcam'>Stop Webcam</a></div>";
						var iframe = '<iframe id="webcam_iframe" title="ProctorHub" scrolling="no" allow="camera; microphone" width="260" height="335" style="border: 0 none;" src="' + PROCTORHUB_DIRECTORY + 'core/webcam_before_exam/?user_id=' + user_id + '&course_id=' + course_id + '&quiz_id=' + quiz_id + '&proctoring_object_id=' + proctoring_object_id + '" />';
						var hideShowText = "<div style='text-align: center; margin: 3px;'><button class='btn btn-primary quiz-publish-button' id='display_webcam'>Hide Webcam</button></div>";
						$('#right-side').append(iframe).append(hideShowText).append(stopWebcamText);
					}

				} else {
					//regex is false, remove webcam
					if ($("#webcam_iframe").length > 0) {
						var iframe = document.getElementById("webcam_iframe").contentWindow;
						iframe.postMessage("end session","*");
						sessionStorage.webCamActive = 'False';
						sessionStorage.removeItem('webCamActive');
					}
				}

			} else {
				//no session_quiz image, remove webcam
				if ($("#webcam_iframe").length > 0) {
					var iframe = document.getElementById("webcam_iframe").contentWindow;
					iframe.postMessage("end session","*");
					sessionStorage.webCamActive = 'False';
					sessionStorage.removeItem('webCamActive');
				}

			}
		}

		$('#stop_webcam').live("click", function(e) {
			var warning = confirm("Stopping the webcam means that you will no longer be recorded for the rest of the exam. Are you sure you want to stop the webcam?");
			if(warning != "" && warning !== null) {
				var iframe = document.getElementById("webcam_iframe").contentWindow;
				//tell it to stop the session
				iframe.postMessage("end session","*");
				e.preventDefault();
				sessionStorage.clear();
				sessionStorage.webCamActive = 'False';
			}
		});

		$("#display_webcam").live("click", function(e) {
			if ($("#display_webcam").html() == "Hide Webcam")
				$("#display_webcam").html("Show Webcam");
			else
				$("#display_webcam").html("Hide Webcam");

			$("#webcam_iframe").toggle();
		});

		$("#submit_quiz_button").liveFirst("click", function(e) {
			if ($("#webcam_iframe").length > 0) {
				var iframe = document.getElementById("webcam_iframe").contentWindow;
				iframe.postMessage("end session","*");
				sessionStorage.clear();
				sessionStorage.webCamActive = 'False';
				sessionStorage.removeItem('webCamActive');
			}
		});
	}
});

// delegate
delegateFirst = function() {
	var args = $.makeArray(arguments);
	var eventsString = args[1];

	if (eventsString) {
		args.splice(0, 2);
		$.fn.delegate.apply(this, arguments);
		moveEventHandlers(this, eventsString, true);
	}

	return this;
};

// live
liveFirst = function() {
	var args = $.makeArray(arguments);

	// live = delegate to the document
	args.unshift(this.selector);
	$.fn.delegateFirst.apply($(document), args);
	return this;
};

function checkSequenceFooter(){
	if( $('#sequence_footer').css('display') == 'none' ){
		$('#popout-btn-container').css('marginTop', '10px').css('marginBottom', '10px');
	}
}

function onElementRendered(selector, cb, _max, _delay, _attempts) {
	var el = $(selector);
	_attempts = ++_attempts || 1;
	if (typeof _delay === undefined) { _delay = 250; }
	if (el.length) return cb(el);
	if (_attempts == _max) return;
	setTimeout(function() {
		onElementRendered(selector, cb, _max, _delay, _attempts);
	}, _delay);
}

function onPage(regex, fn) {
	if (location.pathname.match(regex)) fn();
}

// Accordion
var accordionButtons = $('.ucf-accordion h3>a');

function clickHandler(e) {
  e.preventDefault();
  $control = $(this);

  accordionContent = $control.attr('aria-controls');
  checkOthers($control[0]);

  isAriaExp = $control.attr('aria-expanded');
  newAriaExp = (isAriaExp == "false") ? "true" : "false";
  $control.attr('aria-expanded', newAriaExp);

  isAriaHid = $('#' + accordionContent).attr('aria-hidden');
  if (isAriaHid == "true") {
    $('#' + accordionContent).attr('aria-hidden', "false");
    $('#' + accordionContent).css('display', 'block');
  } else {
    $('#' + accordionContent).attr('aria-hidden', "true");
    $('#' + accordionContent).css('display', 'none');
  }
}

function accordionToggle() {
  $('.ucf-accordion .accordion-control').on('click', clickHandler);
  
  // Allow spacebar to activate the link
  $('.ucf-accordion .accordion-control').keyup(function(e){
    if( e.which == 32 ){
      e.preventDefault();
      $(this).click();
    }
  });
  
  // Disable automatic scrolling when spacebar is pressed down
  $('.ucf-accordion .accordion-control').keydown(function(e){
    if( e.which == 32 ){
      e.preventDefault();
      return false;
    }
  });
};

function checkOthers(elem) {
  for (var i=0; i<accordionButtons.length; i++) {
    if (accordionButtons[i] != elem) {
      if (($(accordionButtons[i]).attr('aria-expanded')) == 'true') {
        $(accordionButtons[i]).attr('aria-expanded', 'false');
        content = $(accordionButtons[i]).attr('aria-controls');
        $('#' + content).attr('aria-hidden', 'true');
        $('#' + content).css('display', 'none');
      }
    }
  }
};


// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-34136689-1', 'auto');
ga('set', 'anonymizeIp', true);
ga('send', 'pageview');
