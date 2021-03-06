var refreshIDs = new Array();
var allColumns = new Array();

// Refreshes all columns
function refreshAll() {
    for ($i=0; $i<allColumns.length; $i++) {
        changeColumn($i, allColumns[$i], true);
    }
}

// Changes the content of one column, and re-sets its refresh.
function changeColumn(colnumber, url, updatedb) {
    if (url.indexOf("----------") == -1) {
        // Normal use
        allColumns[colnumber] = url;
        $("#column" + colnumber).find('a.refreshcolumnbutton').find('span').css("background", "url(images/ajax-loader.gif) 10px 6px no-repeat");
        $("#column" + colnumber).load((url + "&updatedb=" + updatedb), function() {
            $('.wraptext').breakly(20);
            clearInterval(refreshIDs[colnumber]);
            refreshIDs[colnumber] = setInterval(function() {
                changeColumn(colnumber, url, 0);
            }, 300000);
        });
    } else {
        // "Other" selected in dropdown
        document.getElementById("customcolumnentry" + colnumber).disabled = false;
        document.getElementById("customcolumnentry" + colnumber).value = '';
        document.getElementById("customcolumnentry" + colnumber).focus();
    }
}

// Submit status
function submitStatus(status, replyId, postToAccounts) {
    var dataString = 'status=' + encodeURIComponent(status) + "&replyid=" + replyId + "&postToAccounts=" + encodeURIComponent(postToAccounts);
	$.ajax({
        type: "POST",
        url: "actions.php",
        data: dataString,
        success: function() {
            $("input#status").val('');
            $("input#status").parent().children('span.counter').html("140");
			$.growlUI('Done.');
            setTimeout('refreshAll()', 3000);
            return true;
        },
		error: function() {
			$.growlUI('An error occurred, your status was not posted.');
			return false;
		}
    });
    return true;
}

// Fills in the hidden "postToAccounts" field based on which account checkboxes
// are ticked.  Must be called every time a human or CPU alters those checkboxes.
function recheckAccountsSelected() {
    var $servicesEnabled = "";
    $('input.accountSelector').each(function() {
        var $box = $(this);
        if ($box.attr("checked")) {
            $servicesEnabled += $box.val() + ";";
            $box.parents('a.accountselector').addClass("pressed");
        } else {
            $box.parents('a.accountselector').removeClass("pressed");
        }
    });
    $('input#postToAccounts').val($servicesEnabled);
    var dataString = 'posttoservices=' + $servicesEnabled;
    $.ajax({
        type: "POST",
        url: "actions.php",
        data: dataString
    });
    return true;
}


// Enter to submit custom column forms
function checkForSubmitCustomColumn(field, event, colNumber) {
    var charCode;
    if (event && event.which) {
        charCode = event.which;
    } else if (window.event) {
        event = window.event;
        charCode = event.keyCode;
    }
    if (charCode == 13 || charCode == 10) {
        changeColumn(colNumber, "column.php?div=" + colNumber + "&column=" + escape(field.value) + "&count=20", 1);
    }
}

// Set the size of the mainarea div, so that we get h- and v-scroll of the tweet area.
function setDivSize() {
    var vpheight = 0;
    if (typeof window.innerHeight == 'number') {
        vpheight = window.innerHeight; // FF, Webkit, Opera
    } else if (document.documentElement && document.documentElement.clientHeight) {
        vpheight = document.documentElement.clientHeight; // IE 6+
    } else if (document.body && document.body.clientHeight) {
        vpheight = document.body.clientHeight; // IE 4
    }
    d = document.getElementById('mainarea');
    d.style.height= "" + (vpheight-86) + "px";
}

// jQuery startup things (when DOM is avalable)
$(document).ready(function() {

    // Clicking main Submit button posts status
    $('a#submitbutton').unbind("click");
    $('a#submitbutton').live("click", function() {
        recheckAccountsSelected();
        submitStatus($("input#status").val(), $("input#replyid").val(), $("input#postToAccounts").val());
        $("input#status").val('');
        return false;
    });
    
    // Enter in main Text input posts status
    $('input#status').unbind("keydown");
    $('input#status').live("keydown", function(e) {
        if (e.keyCode == 13 || e.keyCode == 10) {
            recheckAccountsSelected();
            submitStatus($("input#status").val(), $("input#replyid").val(), $("input#postToAccounts").val());
            return false;
        } else if (e.keyCode == 38) {
            //up
			document.getElementById('mainarea').scrollTop-=(document.getElementById('mainarea').offsetHeight/10);
			return false;
        } else if (e.keyCode == 40) {
            //down
			document.getElementById('mainarea').scrollTop+=(document.getElementById('mainarea').offsetHeight/10);
			return false;
        } else if (e.keyCode == 33) {
            //pageup
			document.getElementById('mainarea').scrollTop-=document.getElementById('mainarea').offsetHeight;
			return false;
        } else if (e.keyCode == 34) {
            //pagedown
			document.getElementById('mainarea').scrollTop+=document.getElementById('mainarea').offsetHeight;
			return false;
        }
        return true;
    });
    
    // Typing in main box updates the counter.
    $('input#status').unbind("keyup");
    $('input#status').live("keyup", function(e) {
        $(this).parent().children('span.counter').html("" + (140 - $(this).val().length) + "");
        $(this).parent().children('span.counter').forceRedraw(true);
	    if ($(this).val().length > 140) {
	        $(this).parent().children('input#submitbutton').attr('disabled', true);
	    } else {
	        $(this).parent().children('input#submitbutton').attr('disabled', false);
	    }
        return true;
    });
    
    // Click to submit reply form
    $('a#submitreplybutton').unbind("click");
    $('a#submitreplybutton').live("click", function() {
        $success = submitStatus($(this).parent().children('input.reply').val(), $(this).parent().children('input.replyid').val(), $(this).parent().children('input.account').val());     
		if ($success == true) {
			$.fancybox.close();
		}
        return false;
    });

    // Enter to submit reply form
    $('input.reply').unbind("keydown");
    $('input.reply').live("keydown", function(e) {
        if (e.keyCode == 13 || e.keyCode == 10) {
            $success = submitStatus($(this).parent().children('input.reply').val(), $(this).parent().children('input.replyid').val(), $(this).parent().children('input.account').val());
            if ($success == true) {
				$.fancybox.close();
			}
            return false;
        }
        return true;
    });

    // Typing in reply form updates the counter
    $('input.reply').unbind("keyup");
    $('input.reply').live("keyup", function(e) {
        $(this).parent().children('span.replycounter').html($(this).val().length);
		// If the post is long and the counter is visible (i.e. it's Twitter), change the reply button to say "Twixt".
	    if (($(this).val().length > 140) && ($(this).parent().children('span.replycounter').is(":visible"))) {
	        $(this).parent().children('a.submitreplybutton').html("Twixt");
	    } else {
	        $(this).parent().children('a.submitreplybutton').html("Post");
	    }
        return true;
    });
    
    // Popup boxes for the main (top-right) menu options
    $("a.popup").live("click", function() {
        var $url = $(this).attr('href');
        $.fancybox({ 'href': $url,
						'margin' : '0',
						'padding' : '0'});
        return false;
    });
    
    // Click submits popup for Appearance
    $('a#setAppearance').live("click", function() {
            var dataString = 'theme=' + $(this).parent().parent().find('select#theme').val()
                                + '&colsperscreen=' + $(this).parent().parent().find('input#colsperscreen').val()
                                + '&highlighttime=' + $(this).parent().parent().find('input#highlighttime').val();
            $.ajax({
                type: "POST",
                url: "actions.php",
                data: dataString,
                success: function() {
                    window.location.reload(true);
					return false;
                 }
            });
            return false;
    });
    
    // Click submits popup for Banned Phrases
    $('a#setBannedPhrases').unbind("click");
    $('a#setBannedPhrases').live("click", function() {
            var $dataString = 'blocklist=' + $(this).parent().parent().children('textarea#blocklist').val();
			$.ajax({
                type: "POST",
                url: "manageblockscallback.php",
                data: $dataString,
                success: function() {
                    $.fancybox.close();
					refreshAll();
					return false;
                 }
            });
            return false;
    });
    
    // User Checks/unchecks services to post to, updating the current knowledge of
    // the user's preferences.
    $('a.accountselector').unbind("click");
    $('a.accountselector').live("click", function() {
        var $checkbox = $(this).find('input.accountSelector');
        if ($checkbox.is(':checked')) {
            $checkbox.removeAttr('checked');
        } else {
            $checkbox.attr('checked', 'checked');
        }
        recheckAccountsSelected();
    });

    // Click images to switch to showing metadata instead of post text.
    $('img.avatar').unbind("click");
    $('img.avatar').live("click", function() {
        $(this).parents('div.item').find('span.tweettext').toggle();
        $(this).parents('div.item').find('span.metatext').toggle();
        return false;
    });
    
    // Column options button
    $('a.columnoptions').unbind("click");
    $('a.columnoptions').live("click", function(e) {
        $(this).parents('div.columnheading').find('div.columnnav').toggle('fast');
        $(this).parents('div.columnheading').find('a.deletecolumnbutton').toggle();
        return false;
    });
    
    // Column refresh button
    $('a.refreshcolumnbutton').unbind("click");
    $('a.refreshcolumnbutton').live("click", function(e) {
        $(this).find('span').css("background", "url(/images/ajax-loader.gif) 10px 6px no-repeat");  
        return true;
    });
    
    // Convo buttons show/hide conversations
    $('a.convobutton').unbind("click");
	$("a.convobutton").live("click", function() {
         var $url = $(this).attr('href');
         $.fancybox({ 'href': $url,
						'autoDimensions' : false,
						'width' : '50%',
						'height' : '50%',
						'margin' : '0',
						'padding' : '0'});
         return false;
    });
    
    // Reply buttons show the reply box
    $('a.replybutton').unbind("click");
    $('a.replybutton').live("click", function(e) {
        $url = $(this).attr('href');
        $.fancybox({ 'href': $url,
						'autoDimensions' : false,
						'width' : '50%',
						'height' : '34px',
						'margin' : '0',
						'padding' : '0',
                     'onComplete': function() {
                        $('input.reply').putCursorAtEnd();
						return false;
                     }
                     });
        return false;
    });
    
    // "Do action"
    $('a.doactionbutton').unbind("click");
    $('a.doactionbutton').live("click", function(e) {
		var $originaltext = $(this).html();
		if ($(this).hasClass("fullreload")) {
			var $fullReload = true;
		}
        $.ajax({
			url: $(this).attr('href'),
			success: function() {
				$.growlUI('Done.');
				if ($fullReload == true) {
					window.location.reload(true);
				}
			},
			error: function() {
				$.growlUI('An error occurred, the operation did not complete.');
			}
			});
        return false;
    });
    
    // "Confirm action"
    $('a.confirmactionbutton').unbind("click");
    $('a.confirmactionbutton').live("click", function(e) {
		var $url = $(this).attr('href');
		if ($(this).hasClass("fullreload")) {
			var $fullReload = true;
		}
		$.prompt("Are you sure?",{
			callback: function(v,m,f) {
				if (v == true) {
					$.ajax({
						url: $url,
						success: function() {
							$.growlUI('Done.');
							if ($fullReload == true) {
								window.location.reload(true);
							}
						},
						error: function() {
							$.growlUI('An error occurred, the operation did not complete.');
						}
					});
				}
			},
			buttons: { Yes: true, No: false }
		});
        return false;
    });

	// Facebook Like
    $('a.likebutton').unbind("click");
    $('a.likebutton').live("click", function(e) {
		var $url = $(this).attr('href');
		$.prompt("Like this post?",{
			callback: function(v,m,f) {
				if (v == 'like') {
					$.ajax({
						url: ($url + "&like=true"),
						success: function() {
							$.growlUI('Post liked!');
						}
					});
				} else if (v == 'unlike') {
					$.ajax({
						url: ($url + "&like=false"),
						success: function() {
							$.growlUI('"Like" removed.');
						}
					});
				}
			},
			buttons: { Like: 'like', Unlike: 'unlike', Cancel: 'cancel' }
		});
        return false;
    });
    
    // Fancybox images
    $("a.fancybox").live("click", function() {
         var imageurl = $(this).attr('href');
         $.fancybox({ 'href': imageurl,
						'margin' : '0',
						'padding' : '0'});
         return false;
    });
    
    // User Checks/unchecks services to post to, updating the current knowledge of
    // the user's preferences.
    $('input.accountSelector').live("click", function() {
        recheckAccountsSelected();
    });
    
    // Load all columns
    refreshAll();
    
    //$("select, input[type=checkbox], input[type=radio], input[type=file], input[type=submit], a.button, button").uniform();
});

// jQuery onresize things
var resizeTimer;
$(window).resize(function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setDivSize, 100);
});

// jQuery on AJAX start things
/*$(document).ajaxStart(function() {
	$.blockUI({ 
		message: '<img src="images/ajax-loader.gif" alt="Loading..."/>', 
		timeout: 12000,
		showOverlay: false, 
		centerY: false, 
		css: { 
			width: '30px', 
			top: '10px',
			bottom: '', 
			left: '', 
			right: '170px', 
			border: 'none', 
			padding: '5px', 
			backgroundColor: '#00000000', 
			opacity: 1, 
			color: '#000', 
            cursor:'wait' 
		} 
	});
}).ajaxStop($.unblockUI);*/

// Normal startup things (when the page has fully loaded)
function init() {
    setDivSize();
    // Focus status entry box
	document.getElementById('status').focus();
}
