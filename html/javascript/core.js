
/*
 * The main scoreboard API is the $sb() function.  Its use can be:
 *   $sb(function)
 *     The function will be run after the scoreboard has been loaded.
 *   $sb(name)
 *     The name must be the name of a single scoreboard element,
 *     which is in the form of one or more hierarchal element names
 *     (alphanumeric only, no spaces) separated by a period, and
 *     optionally including each element's "Id" attribute value
 *     (any character except paranthesis and single quotes) inside
 *     paranthesis.  For example:
 *       "ScoreBoard.Team(1).Skater(Some Skater name).Number"
 *     This will return an extended jQuery object representing a
 *     single XML document element node which corresponds to the
 *     given element name.  If no named element exists, it is
 *     automatically created.
 *   $sb(jQuery object) or $sb(XML element)
 *     This returns an extended jQuery object, the same as the $sb(name)
 *     function, but corresponding to the passed in unextended jQuery object
 *     or XML element reference.  The XML element must be one from the
 *     scoreboard's XML document structure, and the jQuery object must
 *     represent an XML element from the scoreboard's XML document structure.
 *     An already-extended jQuery object may be passed in, and it will be
 *     returned unmodified.
 *
 * The extended jQuery object returned from the $sb(name) function
 * contains these extended scoreboard-specific functions and fields:
 *   $sb(name)
 *     This is the same as the global $sb(name) function, but it only
 *     searches relative to the object it's called from.  For example:
 *       $sb("ScoreBoard.Team(1).Name")
 *     is equivalent to
 *       $sb("ScoreBoard").$sb("Team(1)").$sb("Name")
 *   $sbName
 *     This field contains the XML element node name.
 *     This does not include the "Id" attribute value.
 *   $sbId
 *     This field contains the XML element "Id" attribute value.
 *     The value may be null if there is no "Id" attribute for this element.
 *   $sbFullName
 *     This field contains the name and "Id" attribute value,
 *     as name(Id).  If "Id" is null, this is identical to $sbName.
 *   $sbPath
 *     This field contains the path, which includes parent elements.
 *     The path is what you pass to the global $sb(name) function
 *     to get this specific element.
 *   $sbExtended
 *     This field is true if the jQuery object has been extended with
 *     the scoreboard-specific fields/functions.
 *   $sbGet()
 *     This function returns the current value of the XML element.
 *   $sbIs(value)
 *     This function returns the boolean value of comparing the
 *     current value of this XML element to the parameter.
 *   $sbIsTrue()
 *     This function returns the boolean value of the
 *     current value of this XML element.
 *   $sbSet(value, [attributes])
 *     This function sets this element's value in the core scoreboard
 *     program.  The attributes parameter is an optional parameter
 *     that can be used to pass attributes to the scoreboard program,
 *     for example the "change" attribute, when set to "true", has
 *     the effect when called on e.g. a Team Score of adding the
 *     parameter to the existing score instead of replacing the
 *     existing score.  The attribute parameter must be a javascript
 *     object, i.e. { }, with zero or more key-value pairs, or it can be
 *     null or undefined.
 *   $sbChange(value)
 *     This function is equivalent to $sbSet(value, { change: "true" })
 *   $sbRemove()
 *     This function removes the element from the core scoreboard program.
 *     Note that elements may not always be able to be removed, and the
 *     scoreboard program may ignore this remove operation if used on
 *     an element that cannot be removed.
 *   $sbBindAndRun(eventType, eventData, handler, initParams)
 *     This is similar to the jQuery bind() function, but also runs the
 *     handler function immediately once.  See _crgUtils.bindAndRun
 *     for details on the function.
 *   $sbBindAddRemoveEach(childName, add, remove)
 *     This binds functions to the add and remove events for the specified
 *     children of this element, and runs the add function once for each
 *     of the existing matched children.  See _crgUtils.bindAddRemoveEach
 *     for details on the function.
 *   $sbElement(type, [attributes], [className])
 *     This function creates HTML element(s) using the type parameter,
 *     by calling the jQuery $(type) function.  The attributes parameter is
 *     an optional parameter that, if used, must be a javascript object
 *     (i.e. { }) with zero or more key-value pairs.  The attributes
 *     are set on all of the created HTML element(s).  The className parameter
 *     is also an optional parameter that must be a string with zero or more
 *     space-separated class names that are added to all the created HTML
 *     element(s).  The attributes parameter may be omitted and the className
 *     parameter used if desired.
 *     Note that the attributes object can contain a special key-value pair
 *     with the key of "sbelement", whose value must be a javascript object
 *     also.  This key will be removed from the attributes object before
 *     setting attributes on the HTML element(s).  See the "sbelement"
 *     section below for details.
 *   $sbControl(type, [attributes], [className])
 *     This function is the same as $sbElement but it also allows changes
 *     to the HTML element(s) to effect the XML element value.  For example,
 *     if the "type" field is "<input type='text'>" then changes to the
 *     text will directly, and immediately, change the XML element value.
 *     The optional attributes javascript object also supports the
 *     special "sbelement" object, and it also supports a "sbcontrol" object
 *     that is explained in the "sbcontrol" section below.
 *
 * sbelement
 * The special "sbelement" object can contain any of these fields which
 * control various aspects of the created HTML element(s) operation.
 *   boolean: boolean
 *     If this is true, the XML element value will be passed through
 *     the isTrue() function, before the convert function/object
 *     (if applicable) is used.
 *   convert: function(value) || object
 *     If a function, it will be used to convert from the XML element
 *     value into the HTML element value.
 *     If an object, it will be checked for each XML element value
 *     (after converting the value to a String), and if the value exists
 *     as a member of the object, that member value will be used.
 *   convertOptions: object
 *     This object controls specific operation of the convert
 *     function/object.  Its parameters can be:
 *     default: HTML-element-specific value
 *       If a converted XML element value is undefined, this value will
 *       be used.
 *     onlyMatch: boolean
 *       If true, any value that is undefined after conversion (including
 *       default) will be reset to the pre-conversion value (after
 *       conversion to boolean, if applicable).
 *   autoFitText: boolean || {}
 *     If true, the HTML element text will be auto-fit to the container,
 *     using _windowFunctions.enableAutoFitText() with no options.
 *     If set to an object, that object will be used as the options.
 *     If needed, the element's auto-fit function can be accessed
 *     by data("AutoFit").
 *
 * sbcontrol
 * The special "sbcontrol" object can contain any of these fields which
 * control various aspects of the created HTML element(s) operation.
 *   convert: function(value)
 *     This function should convert from the HTML element value into
 *     the XML element value.
 *   
 */

$sb = function(arg) {
	if (!arg)
		arg = "";

	if ($.isFunction(arg))
		_crgScoreBoard.doc.one("load:ScoreBoard", function(event) { arg.call($sb(), event); });
	else if (typeof arg == "string")
		return _crgScoreBoard.findScoreBoardElement(_crgScoreBoard.doc, arg);
	else if (($.isjQuery(arg) || (arg = $(arg))) && arg[0] && $.isXMLDoc(arg[0]) && (arg[0].ownerDocument == _crgScoreBoard.doc[0].ownerDocument))
		return _crgScoreBoard.extendScoreBoard(arg);
	else
		return null; // FIXME - return "empty" sb element instead?
};

_crgScoreBoard = {
	scoreBoardRegistrationKey: null,
	POLL_INTERVAL_MIN: 100,
	POLL_INTERVAL_MAX: 500,
	POLL_INTERVAL_INCREMENT: 10,
	pollRate: this.POLL_INTERVAL_MIN,
	doc: $.xmlDOM("<document></document>").find("document"),
	sbExtensions: {
		$sbExtended: true,
		$sb: function(arg) { return _crgScoreBoard.findScoreBoardElement(this, arg); },
/* FIXME - should this paranoid-check for same uuid in specified document, i.e. HTML doc or XML doc? */
		$sbNewUUID: function() { return _crgScoreBoard.newUUID(true); },
		$sbGet: function() { return _crgScoreBoard.getXmlElementText(this); },
		$sbIs: function(value) { return (this.$sbGet() == value); },
		$sbIsTrue: function() { return isTrue(this.$sbGet()); },
		$sbSet: function(value, attrs) { _crgScoreBoard.updateServer(_crgScoreBoard.toNewElement(this, value).attr(attrs||{})); },
		$sbChange: function(value) { this.$sbSet(value, { change: "true" }); },
		$sbRemove: function() { this.$sbSet(undefined, { remove: "true" }); },
		$sbBindAndRun: function(eventType, eventData, handler, initParams) { return _crgUtils.bindAndRun(this, eventType, eventData, handler, initParams); },
		$sbBindAddRemoveEach: function(childName, add, remove) { return _crgUtils.bindAddRemoveEach(this, childName, add, remove); },
		$sbElement: function(type, attributes, className) { return _crgScoreBoard.create(this, type, attributes, className); },
		$sbControl: function(type, attributes, className) { return _crgScoreBoardControl.create(this, type, attributes, className); },
	},

	create: function(sbElement, type, attributes, className) {
		/* specifying attributes is optional */
		if (typeof attributes == "string") {
			className = attributes;
			attributes = {};
		} else if (!attributes)
			attributes = {};
		var sbelement = $.extend(true, {}, attributes.sbelement);
		delete attributes.sbelement;
		var elements = $(type);
		elements.find("*").andSelf()
			.data("sbelement", sbelement)
			.attr($.extend({ "data-sbelement": _crgScoreBoard.getPath(sbElement), "data-UUID": _crgScoreBoard.newUUID() }, attributes))
			.addClass(className);
		_crgScoreBoard.setHtmlValue(elements, sbElement.$sbGet());
		if (sbelement.autoFitText) {
			var autoFitOptions;
			if (typeof sbelement.autoFitText == "object")
				autoFitOptions = sbelement.autoFitText;
			elements.each(function() {
				var autoFitFunction = _windowFunctions.enableAutoFitText($(this), autoFitOptions);
				sbElement.bind("content", autoFitFunction);
			});
		}
		return elements;
	},

	/* From http://www.broofa.com/2008/09/javascript-uuid-function/
	 * With additional super-paranoid checking against UUID of all current HTML elements
	 */
	newUUID: function(notParanoid) {
		var uuid;
		do {
			uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}).toUpperCase();
		} while (!notParanoid && $("[data-UUID="+uuid+"]").length);
		return uuid;
	},

	updateServer: function(e) {
		$.ajax({
				url: "/XmlScoreBoard/set?key="+_crgScoreBoard.scoreBoardRegistrationKey,
				type: "POST",
				processData: false,
				contentType: "text/xml",
				data: e[0].ownerDocument
			});
	},

	extendScoreBoard: function(e) {
		if (e.$sbExtended)
			return e;

		e.context = _crgScoreBoard.doc[0];
		e.selector = _crgScoreBoard.getSelector(e);
		e.$sbName = e[0].nodeName;
		e.$sbId = $(e).attr("Id");
		e.$sbFullName = e.$sbName + (e.$sbId==undefined?"":"("+e.$sbId+")");
		e.$sbPath = _crgScoreBoard.getPath(e);
		return $.extend(e, _crgScoreBoard.sbExtensions);
	},

	getPath: function(e) {
		if (e[0] == this.doc[0])
			return "";
		var name = e[0].nodeName;
		var id = e.attr("Id");
		var p = this.getPath(e.parent());
		return p+(p?".":"")+name+(id?"("+id+")":"");
	},

	getSelector: function(e) {
		if (e[0] == this.doc[0])
			return "";
		var s = this.toSelector(e[0].nodeName, e.attr("Id"));
		var p = this.getSelector(e.parent());
		return p+(p?">":"")+s;
	},

	toSelector: function(name, id) {
		return name+(id?"[Id='"+id+"']":":not([Id])");
	},

	toNewElement: function(e, newText) {
		if (!e)
			e = this;

		if (e[0] == _crgScoreBoard.doc[0])
			return $.xmlDOM("<"+e[0].nodeName+"/>").children(e[0].nodeName);

		return _crgScoreBoard.createScoreBoardElement(_crgScoreBoard.toNewElement(e.parent()), e[0].nodeName, e.attr("Id"), newText);
	},

	findScoreBoardElement: function(parent, path, doNotCreate, updateFromServer) {
		var p = path.match(/[\w\d]+(\([^\(\)]*\))?/g);
		var me = parent;
		$.each((p?p:[]), function() {
				var name = this.replace(/\(.*$/, "");
				var id = this.match(/\([^\)]*\)/);
				if (id)
					id = id.toString().replace(/[\(|\)]/g, "")
				var child;
				if (!(child = me.children(_crgScoreBoard.toSelector(name,id))).length) {
					if (doNotCreate)
						return (me = false);
					child = _crgScoreBoard.createScoreBoardElement(me, name, id);
					if (!updateFromServer)
						$sb(child).$sbSet();
				}
				me = child;
			});
		if (me === false)
			return null;
		else
			return $sb(me);
	},

	removeScoreBoardElement: function(parent, e) {
		if (!e) return;
		e.children(function() { removeScoreBoardElement(e, $sb(this)); });
		parent.trigger("remove", [ e ]);
		parent.trigger("remove:"+e.$sbName, [ e ]);
		e.remove();
	},

	createScoreBoardElement: function(parent, name, id, text) {
		var e = $(parent[0].ownerDocument.createElement(name));
		if (id)
			e.attr("Id", id);
		_crgScoreBoard.setXmlElementText(e, text);
		parent.append(e);
		return e;
	},

	getXmlElementText: function(e) {
		if (isTrue(e.attr("empty")))
			return "";
		var text = "";
		e.contents().filter(function() { return this.nodeType == 3; }).each(function() { text += this.nodeValue; });
		return (text || null);
	},

	setXmlElementText: function(e, text) {
		e.contents().filter(function() { return this.nodeType == 3; }).remove();
		if (text)
			e.removeAttr("empty").append(e[0].ownerDocument.createTextNode(text));
		else if (text === "")
			e.attr("empty", "true");
		else
			e.removeAttr("empty");
		return e;
	},

//FIXME - move this to windowfunctions
	setHtmlValue: function(htmlelements, value) {
		htmlelements.each(function() {
			var e = $(this);
			var v = value; // Don't modify the main value, since we are in $.each()
			var sbC = e.data("sbcontrol") || {};
			var sbE = e.data("sbelement") || {};
			if (sbE["boolean"])
				v = isTrue(v);
			var convertOptions = sbE.convertOptions || {};
			if (sbE.convert) {
				if (typeof sbE.convert == "function")
					v = sbE.convert(value);
				else if (typeof sbE.convert == "object")
					v = sbE.convert[String(value)];
				if (v === undefined)
					v = convertOptions["default"];
				if (v === undefined && isTrue(convertOptions.onlyMatch))
					v = (sbE["boolean"] ? isTrue(value) : value);
			}
			if (e.is("a,span")) {
				if (e.html() != v)
					e.html(v);
			} else if (e.is("img"))
				e.attr("src", v);
// FIXME - may need to support multiple video files with multiple source subelements?
// FIXME - need to start video when visible and when changing src; stop when not visible.
			else if (e.is("video"))
				e.attr("src", v);
			else if (e.is("input:text,input:password,textarea"))
				e.val(v);
			else if (e.is("input:checkbox")) {
				e.attr("checked", isTrue(v));
				try { e.button("refresh"); } catch (err) { /* checkbox wasn't a button(), ignore err */ }
			} else if (e.is("input:radio"))
				e.attr("checked", (e.val() == v));
			else if (e.is("input:button,button")) {
				if (sbC && sbC.setButtonValue)
					sbC.setButtonValue.call(this, v);
/* FIXME - uncomment this once any users of $sbControl(<button>) have added noSetButtonValue parameter
 *         or, add parameter automatically if button linked to input text
				else if (!sbC || !sbC.noSetButtonValue)
					e.val(v);
*/
			} else if (e.is("select"))
				e.val(v);
			else
				alert("ADD SUPPORT FOR ME: node type "+this.nodeName);
		});
		return htmlelements;
	},

	processScoreBoardElement: function(parent, element, triggerArray) {
		var $element = $(element);
		var name = element.nodeName;
		var id = $element.attr("Id");
		var remove = isTrue($element.attr("remove"));
		var e = this.findScoreBoardElement(parent, name+(id?"("+id+")":""), remove, true);
		var triggerObj = { node: e };
		if (remove) {
//FIXME - move the "remove" triggers into group below...
			this.removeScoreBoardElement(parent, e);
			return;
		}
		var newContent = _crgScoreBoard.getXmlElementText($element);
		if (newContent !== null) {
			var oldContent = _crgScoreBoard.getXmlElementText(e);
			if (oldContent !== newContent) {
				_crgScoreBoard.setXmlElementText(e, newContent);
				_crgScoreBoard.setHtmlValue($("[data-sbelement="+e.$sbPath+"]"), newContent);
				triggerObj.fireContent = true;
				triggerObj.oldContent = oldContent;
				triggerObj.newContent = newContent;
			}
		}
		var fireEvents = false;
		if (!triggerArray) {
			triggerArray = [];
			fireEvents = true;
		}
		triggerArray.push(triggerObj);
		$element.children().each(function() { _crgScoreBoard.processScoreBoardElement(e, this, triggerArray); });
		if (fireEvents) {
			$.each(triggerArray, function() {
				if (!this.node.data("_crgScoreBoard:addEventTriggered")) {
					this.node.data("_crgScoreBoard:addEventTriggered", true);
					this.node.parent().trigger("add", [ this.node ]);
					this.node.parent().trigger("add:"+this.node.$sbName, [ this.node ]);
				}
				if (this.fireContent)
					this.node.trigger("content", [ this.newContent, this.oldContent ]);
			});
		}
	},

	processScoreBoardXml: function(xml) {
		$(xml).find("document").children().each(function(index) { _crgScoreBoard.processScoreBoardElement(_crgScoreBoard.doc, this); });
		$sbThisPage = $sb("Pages.Page("+/[^\/]*$/.exec(window.location.pathname)+")");
		_crgScoreBoard.doc.triggerHandler("load:ScoreBoard");
	},

	parseScoreBoardResponse: function(xhr, textStatus) {
		try {
			switch (xhr.status) {
			case 304: /* No change since last poll, increase poll rate */
				_crgScoreBoard.pollRate += _crgScoreBoard.POLL_INTERVAL_INCREMENT;
				return;
			case 404:
//FIXME - we could possibly handle this better than reloading the page...
				window.location.reload();
				break;
			case 200:
				_crgScoreBoard.processScoreBoardXml(xhr.responseXML);
				_crgScoreBoard.pollRate = _crgScoreBoard.POLL_INTERVAL_MIN;
				break;
			case 0: /* FIXME - handle network errors? */ break;
			default: /* FIXME - handle other server response? */ break;
			}
		} finally {
			if (_crgScoreBoard.pollRate > _crgScoreBoard.POLL_INTERVAL_MAX)
				_crgScoreBoard.pollRate = _crgScoreBoard.POLL_INTERVAL_MAX;
			setTimeout(this.pollScoreBoard, this.pollRate);
		}
	},

	pollScoreBoard: function() {
		$.ajax({
				url: "/XmlScoreBoard/get",
				data: { key: _crgScoreBoard.scoreBoardRegistrationKey },
				complete: function(xhr,textStatus) { _crgScoreBoard.parseScoreBoardResponse(xhr, textStatus); }
			});
	},

	parseRegistrationKey: function(xml, status) {
		this.scoreBoardRegistrationKey = $(xml).find("document>Key").text();
		this.pollScoreBoard();
	},

	scoreBoardRegister: function() {
		$.ajax({
				url: "/XmlScoreBoard/register",
				success: function(xml,status) { _crgScoreBoard.parseRegistrationKey(xml, status); },
				//FIXME - really handle error
				error: function() { alert("error registering with scoreboard"); }
			});
	}
};