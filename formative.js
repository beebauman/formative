/* ========================================================================

   Formative.

======================================================================== */


/* === Debug logging. === */

// Turn debug logging on (1) or off (0).
var DEBUG = 1;


/* === User configurable options. === */

// CSS classes for validity styles. Replace if desired.
var classForValidField             = 'formative-valid';               // If you use your own class, limit rule to :focus
var classForInvalidField           = 'formative-invalid';             // If you use your own class, limit rule to :focus
var classForInvalidFieldPersistent = 'formative-invalid-persistent';
var classForValidText              = 'formative-text-valid';
var classForInvalidText            = 'formative-text-invalid';
var classForErrorMessage              = 'formative-text-error';

// Animation options.
var scrollToTopmostErrorOnSubmitAnimationDuration   = 600;
var wordCounterShowHideAnimationDuration            = 400;
var showHiddenAutoFilledFormGroupAnimationDuration  = 300;
var defaultAutoAdvanceDelay                         = 250;
var defaultAutoFillDelay                            = 150;

// Profix for the number of words used in word counters.
var wordCounterCountPrefix = 'Word count: ';

// IP-based AutoFill options.
var autoFillCountryDialCode = true;
var phoneNumberFieldId = 'phone_number';
var autoFillAddressCountry = true;
var countryFieldId = 'country';
var autoFillCityStateAfterZip = true;
var onlyShowStateCityAfterZip = true;
var zipFieldId = 'zip';
var cityFieldId = 'city';
var stateFieldId = 'state';

// Selector for elements that Formative validates, and exceptions.
  var elementsToValidateSelector = 'input, textarea';
var elementsToValidateExceptionsSelector = "[type='file']";

var validationEvents = 'input propertychange focus';
/* var validationEvents = 'focus change keyup keydown paste input textinput delete drop redo undo'; */


/* === Internal parameters. === */

// CSS classes that activate specific Formative features.
var classForFormGroup = 'form-group';
var classForMultiFields = 'multi-field';
var classForWordCountedField = 'word-counted';

// Data attribute names in JavaScript format.
var minWordsAttribute                = 'formativeMinWords';
var maxWordsAttribute                = 'formativeMaxWords';
var wordCountPrefixAttribute         = 'formativeWordCountPrefix'
var functionAttribute                = 'formativeFunction';
var patternAttribute                 = 'formativePattern';
var typeAttribute                    = 'formativeType';
var requiredAttribute                = 'formativeRequired';
var hopAttribute                     = 'formativeHop';
var keyboardAttribute                = 'formativeKeyboard';
var errorAttribute                   = 'formativeError';
var autoAdvanceAttribute             = 'formativeAutoAdvance';
var hasBeenAdvancedAttribute         = 'formativeHasBeenAdvanced'

// URL for E.164 country code list.
var countryDataUrl = 'http://www.newtonacademy.org/fw/formative/e164-country-codes.json';

var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/* === INTERNAL FUNCTIONS. === */


/* === Debugging. === */

// When debugging is on, debugLog() prints a supplied string to the console.
function debugLog(str) { if ( DEBUG && window.console ) console.log(str); }

/* Converts a data attribute's name from JavaScript to HTML format. This enables 
   direct access to the DOM data attributes, for example: 
     $(#'my-field').attr(htmlNameOfDataAttribute(errorAttribute))
   Using .data(), we can only access jQuery's cached attribute copies, e.g.:
     $(#'my-field').data(errorAttribute)  
   Usually that's what we want to do, because it's faster, and we're not too 
   worried that our data-formative-* properties will be updated by something external
   after jQuery's cache is saved. */
function htmlNameOfDataAttribute (attribute) {
  attribute.replace(/([a-z][A-Z])/g, function (match) { 
    return match[0] + '-' + match[1].toLowerCase();
  });
  return 'data-' + attribute;
}


/* === Convienience. === */

function isDefined (value) {
  return typeof value !== 'undefined';
}

function fieldHasAttribute (field, attribute) {
  return isDefined(field.data(attribute));
}

function formFieldsToValidate() {
  return $(elementsToValidateSelector).not(elementsToValidateExceptionsSelector);
}


/* === Validation. === */

function validateField (field) {
  if ( fieldIsValid(field) ) {
  
    applyValidationStyleToField(field, { valid: true });
    
    if ( siblingsInMultiFieldAreAlsoValid(field) && errorDivForField(field).length > 0 )
      errorDivForField(field).remove();
      
    if ( fieldHasAttribute(field, autoAdvanceAttribute) && field.data(autoAdvanceAttribute) == true && field.data(hasBeenAdvancedAttribute) == false ) {
      advanceToNextField(field);
      field.data(hasBeenAdvancedAttribute, true);
    }
        
  } else {
    applyValidationStyleToField(field, { valid: false, evenWhenNotFocused: false });
    field.data(hasBeenAdvancedAttribute, false);
  }
}

function fieldIsValid (field) {
  
  var validity;


  /* === Fields validated by word count. === */
  
  if ( fieldIsValidatedByWordCount(field) ) {
    var validRange = validWordCountRangeForField(field);
    var minWords = validRange[0], maxWords = validRange[1]
    var wordCount;
    if ( minWords == 0 && maxWords == 0 ) { // Just a safety, we already made sure at least one was defined.
      validity = true;
    } else {
      wordCount = wordCountForField(field);
      if ( ( wordCount > minWords || minWords == 0 ) && ( wordCount < maxWords || maxWords == 0 )  )
        validity = true; else validity = false;
    }


  /* === Fields validated by custom function. === */
  
  } else if ( fieldHasAttribute(field, functionAttribute) ) {
    var customFunction = field.data(functionAttribute);
    validity = customFunction(field);
  
  
  /* === Fields validated by pattern. === */
  
  } else if ( fieldHasAttribute(field, patternAttribute)  ) {
    var patternString = field.data(patternAttribute);
    var pattern = new RegExp(patternString);
    if ( ! isDefined (field.val()) ) field.val('');
    if ( pattern.test(field.val()) == false )
      validity = false; else validity = true;
      
      
  /* === Fields that aren't validated. === */

  } else { validity = true }
  
  
  /* === Debug log field validity. === */
  
  var validityString = validity ? 'valid' : 'invalid';
  debugLog(field.attr('id') + " is " + validityString + '.')

  
  return validity;
}

function allFieldsInMultiFieldOf (field) {
  return field.parents('.' + classForMultiFields).find(elementsToValidateSelector).not(elementsToValidateExceptionsSelector);
}

function siblingsInMultiFieldAreAlsoValid (field) {

  allFieldsInMultiField = allFieldsInMultiFieldOf(field);
    
  if ( allFieldsInMultiField.length == 0 ) {
    return true;
    
  } else if ( allFieldsInMultiField.length > 1 ) {
  
    var result = true;
    
    allFieldsInMultiField.each(function () {
      if ( ! fieldIsValid($(this)) ) result = false;
    });
    
    return result;
  }
}

function applyValidationStyleToField (field, options) {

  var invalidClass = classForInvalidField;
  var validClass = classForValidField;
  
  // Default values:
  if ( ! isDefined(options) )                    options                    = {};
  if ( ! isDefined(options.evenWhenNotFocused) ) options.evenWhenNotFocused = false;
  if ( ! isDefined(options.valid) )              options.valid              = false;
  
  /* If an field is valid and we're removing invalid styles, we always 
     remove .invalid-nofocus. If an field is invalid and we're *applying* 
     invalid styles, we only apply .invalid-nofocus if the evenWhenNotFocused is true. */
  if (options.valid == true || options.evenWhenNotFocused == true )
    invalidClass = classForInvalidField + ' ' + classForInvalidFieldPersistent;
  
  var classToAdd    = options.valid ?   validClass : invalidClass;
  var classToRemove = options.valid ? invalidClass :   validClass;
  
  field.addClass(classToAdd);
  field.removeClass(classToRemove);
}


/* === Word counting. === */

function fieldIsValidatedByWordCount (field) {
  return ( fieldHasAttribute(field, minWordsAttribute)  || fieldHasAttribute(field, maxWordsAttribute) );
}

function validWordCountRangeForField (field) {

  var minWords = 0, maxWords = 0;
  
  if ( fieldHasAttribute (field, minWordsAttribute) )
    minWords = parseInt(field.data(minWordsAttribute), 10);

  if ( fieldHasAttribute (field, maxWordsAttribute) )
    maxWords = parseInt(field.data(maxWordsAttribute), 10);
  
  return [minWords, maxWords];
}

function wordCountForField (field) {
  var wordCount;
  if ( field.val() == ''  )
    wordCount = 0;
  else
   wordCount = field.val().match(/\S+/g).length;
  return wordCount;
}

function updateWordCounterForField (field) {
  var count = wordCountForField(field);
  var valid = fieldIsValid(field);
  var counter = $('#' + field.attr('id') + '-count');
  counter.html(wordCounterCountPrefix + count);
  if ( valid ) {
    counter.removeClass(classForInvalidText);
    counter.addClass(classForValidText);
  }  else {
    counter.removeClass(classForValidText);
    counter.addClass(classForInvalidText);
  }
}


/* === Error messages. === */

function showErrorForInvalidField (field) {
  
  var divToTakeMessageFrom = field;
  var divToPlaceErrorAfter = field;

  // If current field is in a .multi-field:
  var allFieldsInMultiField = allFieldsInMultiFieldOf(field);
  if ( allFieldsInMultiField.length > 1  ) {
    divToTakeMessageFrom = allFieldsInMultiField.last();
    divToPlaceErrorAfter = field.parents('.' + classForMultiFields).children('*:last-child');
  }
  
  // If the current field has an error message set, display it.
  if ( fieldHasAttribute(divToTakeMessageFrom, errorAttribute) ) {
  
    // Add the error div to the page, unless we've already added the error to this .multi-field because a different field in it was invalid.
    if ( errorDivForField(field).length == 0 )
      divToPlaceErrorAfter.after('<div class="' + classForErrorMessage + ' ' + divToTakeMessageFrom.attr('id') + '">' + divToTakeMessageFrom.data(errorAttribute) + '</div>');
  }
}

function errorDivForField (field) {

  // Assuming the current form field is the only one in its form group:
  var errorDiv = $('.' + classForErrorMessage + '.' + field.attr('id'));

  // If the current field is not alone in its form group:
  allFieldsInMultiField = allFieldsInMultiFieldOf(field);
  if ( allFieldsInMultiField.length > 1 )
    errorDiv = $('.' + classForErrorMessage + '.' + allFieldsInMultiField.last().attr('id'));
  
  return errorDiv;
}


/* === Auto-advance. === */

// Find the next field and move focus to it.
function advanceToNextField (field, delay) {
  if ( ! deviceIsIOS ) {
    if ( ! isDefined(delay) ) delay = defaultAutoAdvanceDelay;
  
    var allFields = formFieldsToValidate();
    var fieldIndex = allFields.index(field);
    var nextField = allFields.eq(fieldIndex + 1);
    
    if ( isDefined(nextField) )
      setTimeout(function () {
        nextField.trigger('focus');
      }, delay);
  }
}


/* === AutoFill. === */

function tellFieldToAutoFillValueWhenFocused (field, fillValue, options) {
  
  // Default values:
  if ( ! isDefined(options) )                    options                    = {};
  if ( ! isDefined(options.fillDelay) )          options.fillDelay          = defaultAutoFillDelay;
  if ( ! isDefined(options.advanceDelay) )       options.advanceDelay       = defaultAutoAdvanceDelay;
  if ( ! isDefined(options.advanceToNextField) ) options.advanceToNextField = false;
  
  field.one('focus', function() {
    setTimeout(function () {
      if ( field.val() === '' ) field.val(fillValue);
      validateField(field);
      if ( options.advanceToNextField )
          advanceToNextField(field, options.advanceDelay);
    }, options.fillDelay);
  });
  
  // In case we just set the AutoFill focus handler, but the field was not visible or already in focus, so it wasn't triggered:
  if ( field.is(':focus') ) field.trigger('focus');
}

function showFormGroupAndFillField (field, fillValue) {
  field.parents('.' + classForFormGroup).slideDown(showHiddenAutoFilledFormGroupAnimationDuration, function () {
    field.val(fillValue);
  });
}


/* === IP address geolocation based AutoFill. === */

var country;
var countryLetterCode;
var countryCallingCode;
var countryTld;
var zip;
var state;
var city;

function shouldLoadGeocodingData () {
  return ( autoFillAddressCountry || autoFillCountryDialCode || autoFillCityStateAfterZip );
}

if ( shouldLoadGeocodingData() ) {
  
  // Load the JSON object that maps countries to country dialing codes.
  $.getJSON(countryDataUrl, function(json) {
    
    // Get the user's country based on IP address from an API.
    $.getJSON('http://api.wipmania.com/jsonp?callback=?', function (data) { 
    
      // Store the two letter country code from the API's response.
      countryLetterCode = data.address.country_code;
      
      // Later, we'll need country TLD for the Google geocoding API. Country TLD is the same as the 2 letter country code, with the only notable exception being Great Britian.
      countryTld = ( countryLetterCode == 'gb' ) ? 'uk' : countryLetterCode;

      if ( isDefined(countryLetterCode) && countryLetterCode.length == 2 ) {
        
        // Find the user's country in our JSON object.
        for ( var i in json.countries ) {
          var countryData = json.countries[i];
          if ( countryData['code'].toUpperCase() === countryLetterCode.toUpperCase() ) {
            country = countryData['name'];
            countryCallingCode = countryData['phoneCode'];
          }
        }
        
        // Set the appropriate fields to automatically fill our location values when focused:
        
        if ( autoFillAddressCountry ) {
          $(document).ready(function () {
            tellFieldToAutoFillValueWhenFocused($('#' + countryFieldId), country, {advanceToNextField: true});
          });
        }
        
        if ( autoFillCountryDialCode ) {
          $(document).ready(function () {
            tellFieldToAutoFillValueWhenFocused($('#' + phoneNumberFieldId), '+' + countryCallingCode + ' - ');
          });
        }

        if ( autoFillCityStateAfterZip ) {
          
          // Add a blur handler to the ZIP field, so that after the user enters ZIP, we'll get their city and state from the Google geocoding API. 
          $(document).ready(function () {
            $('#' + zipFieldId).on('blur', function (event) {
              zip = $(this).val();
              if ( isDefined(zip) && zip.length > 0 ) {
                $.getJSON('http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + zip + '&region=' + countryTld, function(json) {
                  if ( json.status == 'OK' ) {

                    // Extract state and city from the returned result:
                    
                    /* We'll construct an array of what Google calls "administrative areas", which are entities 
                      beneath the country level. We'll store them in size order, largest first. We rely on the 
                      API to returns address_components in escalating size. Google also returns a locality, which 
                      may or may not be the right value to use for city. For example, for ZIP 11213, the locality 
                      is New York, but the correct value for city (even though it's technically a county, not a 
                      city) is administrative_area_level_3, which is Brooklyn. Without extensive testing of different 
                      countries and localities, we'll implement logic that uses the locality as long as there 
                      are fewer than three administrative areas, and uses the lowest level administrative area 
                      otherwise. For state, we'll always use the highest level administrative area. Our hope is 
                      that this covers 98% of users perfectly. The other 2% can edit the AutoFilled values. */
                    var adminAreas = [];
                    var locality;
                    for ( var i in json.results[0].address_components ) {
                      var addressComponent = json.results[0].address_components[i];
                      var types = addressComponent.types;
                      if ( types.indexOf('administrative_area_level_3') != -1 || types.indexOf('administrative_area_level_2') != -1 || types.indexOf('administrative_area_level_1') != -1)
                        adminAreas.unshift(addressComponent.long_name);
                      if ( types.indexOf('locality') != -1 )
                        locality = addressComponent.long_name;
                    }
                    state = adminAreas[0];
                    if ( isDefined(locality) && adminAreas.length < 3 )
                      city = locality;
                    else
                      city = adminAreas[adminAreas.length - 1];
                  } /* === if ( json.status == 'OK' ) { === */
                  
                  // If City and State are configured to be hidden until ZIP is filled:
                  if ( onlyShowStateCityAfterZip ) {
                    showFormGroupAndFillField($('#' + stateFieldId), state);
                    showFormGroupAndFillField($('#' + cityFieldId), city);
                    
                  // If City and State are already showing:
                  } else {
                    tellFieldToAutoFillValueWhenFocused($('#' + stateFieldId), state, {advanceToNextField: true});
                    tellFieldToAutoFillValueWhenFocused($('#' + cityFieldId), city, {advanceToNextField: true});
                  }
                                    
                  if ( state == '' ) $('#' + stateFieldId).trigger('forceFocus');
                  if ( city == '' ) $('#' + cityFieldId).trigger('forceFocus');

                }); /* === $.getJSON('http://maps.googleapis.com..., function(json) { === */
                
              } /* === if ( isDefined(zip) && zip.length > 0 ) { === */
              
            }); /* === $('#' + zipFieldId).on('blur', function (event) { === */
            
          }); /* === $(document).ready(function () { === */
          
        } /* === if ( autoFillCityStateAfterZip ) { === */
        
      } /* === if ( isDefined(countryLetterCode) && countryLetterCode.length == 2 ) { === */
      
    }); /* === $.getJSON('http://api.wipmania.com/jsonp?callback=?', function (data) { === */
    
  }); /* === $.getJSON(countryDataUrl, function(json) { === */
  
} /* === if ( shouldLoadGeocodingData() ) { === */


/* === Primary document.ready handler. === */

$(document).ready(function () {


  /* === Hide our State and City form groups if they're configured to be shown only after ZIP is filled. === */
  
  if ( onlyShowStateCityAfterZip ) {
    $('#' + stateFieldId + ', #' + cityFieldId).parents('.' + classForFormGroup).css('display', 'none');
  }

  
  /* === Loop through each form field we're going to be validating. === */
  
  formFieldsToValidate().each(function(index, field) {
    
    // Set the pattern for fields marked required.
    if (   fieldHasAttribute($(field), requiredAttribute) &&
         ! fieldHasAttribute($(field), patternAttribute)  &&
         ! fieldHasAttribute($(field), typeAttribute)        )
      $(field).data(patternAttribute) = '.+';
    
    // *** Set pattern for fields set with a data-formative-type... ***
    
    // If the field is supposed to auto-advance when it becomes valid, set a state flag so we'll be able to only advance one time.
    if ( fieldHasAttribute($(field), autoAdvanceAttribute) )
      $(field).data(hasBeenAdvancedAttribute, false);
    
    // Process the data-formative-keyboard attribute:
    
    var keyboard = $(field).data(keyboardAttribute);

    // If the HTML5 pattern attribute is '[0-9]*', Mobile Safari (and perhaps other browsers) will display a numeric keyboard. This doesn't affect formative validation.
    if ( keyboard === 'number' )
      $(field).attr('pattern', '[0-9]*');
    
    if ( keyboard == 'email' )
      $(field).attr('type', 'email');
  });
  
  /* === Process word counted fields. === */
  
  // For each word counted field, add a word counter to the document, and set it to show and hide when the counted field goes into and out of focus.
  $('.' + classForWordCountedField).each(function(index, countedDiv){
    var counterDivId = $(this).attr('id') + '-count';
    $(countedDiv).after('<div class="em" id="' + counterDivId + '">' + wordCounterCountPrefix + '0</div>')
    var counterDiv = $('#' + counterDivId);
    counterDiv.css('display', 'none');
    $(countedDiv).on('focus blur', function () {
      counterDiv.slideToggle(wordCounterShowHideAnimationDuration);
    });
  });

  
  /* === Form submission handling. === */
  
  // If there are invalid form fields, show errors and prevent submission.
  $("form").submit(function () {
  
    // Start by assuming all fields are valid.
    $('.' + classForErrorMessage).remove();
    var formIsValid = true;
    
    // If any form field is invalid, invalidate the form, outline the field in red, and show an error under it (if one is set for the current form group).
    formFieldsToValidate().each(function () {
      if ( ! fieldIsValid($(this)) ) {
        formIsValid = false;
        applyValidationStyleToField ($(this), { valid: false, evenWhenNotFocused: true });
        showErrorForInvalidField ($(this));
      }
    });
  
    // If the form is valid, let it submit.
    if ( formIsValid ) {
      return true;
      
    // If it's invalid, scroll to the topmost invalid form group (accounting for padding-top on the <body>) and stop the submission.
    } else {
      $('html, body').animate(
        { scrollTop: $('.' + classForInvalidField).first().parent().offset().top - parseInt( $('body').css('padding-top'), 10) },
        scrollToTopmostErrorOnSubmitAnimationDuration
      );
      return false;
    }
  });
  
  
  /* === Real-time validation handling and word counting. === */
  
  formFieldsToValidate().each(function () {
    $(this).on(validationEvents, function() {
      validateField($(this));
      if ( $(this).hasClass(classForWordCountedField) )
        updateWordCounterForField($(this));
    });
  });
  
    
}); /* === End of primary document.ready handler. === */
