# Formative

Formative is a wise and gentle shepherd, guiding form fillers toward the all-important submit button.

## Form design philosophy

- Avoid annoying the user even slightly.
- Position requests for user input prominently, and format them boldy.
- Use simple, concise, and unambiguous language.
- Make the next step exceedingly obvious.
- Always show the user what has been completed and what remains.
- Only ask for things you really need and can't figure out yourself.
- Request natural input and parse it yourself.

## Getting started

Here's a really simple example. You should also check out the extensive example *** somewhere ***.

...Simple form example...

## Prerequisites

Formative requires jQuery 1.10.2 or above. I haven't tested it with older versions.

FastClick.

## Features

### Field validation

To have Formative handle validation of a form field, you can specify a regex pattern, just like the HTML5 pattern element but without any of the associated headaches.

For even more control and complexity, specify a custom function that Formative can use to test validity.

You can also specify a supported common field type that Formative knows how to validate, e.g. email.

You can also have optional fields.

### Real-time validity feedback

Formative responds to changes in field validity in real-time, keeping the user aware of input validity as they type, using obvious but unobstrusive visual cues.

You can use the default cue styles or specify your own.

### Submission gatekeeping

Formative only allows a form submission to proceed if all fields are valid.

Before a submission attempt, Formative only applies validity cues to the field in focus. If an invalid form is submitted, Formative scrolls up to the topmost invalid field, and applies persistent cues to all invalid fields, creating a map for the user to follow. When a field is corrected, its validation cue is removed, and focus hops to the next invalid element.

#### Error messages

A field can be configured with an error message that will display under it when invalid after a submission attempt.

#### Multi-Fields

Sometimes a form needs to collect a single value composed of multiple elements, for example a date of birth consisting of month, day, and year. You can enclose such related fields in a wrapper `<div>` of class `multi-field`. Formative will treat each field as an individual in applying visual cues for validity state, but only a single error message will be displayed for the entire `.multi-field`. This is useful when displaying a unique error per element is impractical or undesirable, such as a case where the `.multi-field`'s individual fields are very small.

### IP-based autofill

If you anticipate hosting users from multiple countries, this feature can save the user a little bit of work. Right now, it does just two things:

1. Autofills the name of the user's country.
2. Partially fills the the phone number field by entering the E.164 country calling code, also referred to as the international dialing prefix. This eliminates ambiguity for users, especially foreign ones, who may be unaware that you can't call them without it, may forget to include it, or may be unsure as to whether it is required.

Because it has a better accuracy rate, we use IP address to determine location, rather than simply obtaining the country setting from the system or browser.

The actual fill event happens the first time the user focuses on a field. We delay for an instant, just long enough to be noticed, and then we pleasantly surprise them by filling in the value with a gentle yet playful animation. If we've simply inserted a helpful prefix, our work is done. If we've filled the complete field, we hop over and move focus to the next field after another tiny delay.

Technical notes: The IP-based autofill feature uses the [WIPmania API](https://www.wipmania.com/en/api/) for gelocation and reverse geocoding. Formative includes its own JSON file containing E.164 country calling code information, which we coverted from an XML list found at <https://code.google.com/p/country-phone-codes>.

### Word counting

If you add the `word-counted` class to a field, Formative will automatically show a word count `<div>` directly under the field, and update the count in real time. If you use this feature together with the `data-formative-min-words` and/or `data-formative-max-words` options, Formative will apply visual validity state cues to the counter along with the counted field itself.

***

## Field options

### How to set field options

Field options are set directly on the field itself using HTML5 `data-*` attributes. You can set them directly in your HTML, or you can use JavaScript or jQuery. Here's how you might set the hypothetical `data-formative-some-option` on `#my-field`:

**Using HTML:**

    <input type="text" id="my-field" data-formative-some-option="value" />

**Using jQuery:**

    $('#my-field').data('formativeSomeOption', 'value');

By convention, HTML5 `data-*` attributes use lower case letters and separate words with a dash. To set an option in HTML, prefix it with `data-formative`. If using JavaScript, omit `'data-'`, and use `CamelCase` instead of dashes to separate words, as shown in the example above.

***

### Validity specifiers

***

#### `data-formative-required`

**Description:**

Specifies whether or not the field can be blank.

**Acceptable values:**

`true` or `false`.

**Example:**

    <input type="text" id="my-field" data-formative-required="true" />

**Discussion:**

Equivalent to setting `data-formative-pattern` to `".+"`

Setting this option to `false` has no effect, because by default, a field is not required.

***

#### `data-formative-type`

**Description:**

Use a preconfigured validation pattern that is based on standard rules for a common field type.

**Acceptable values:**

`email`: Validate that the entered value has at least one character before the `@`, and before and after after the `.`.

**Example:**

    <input type="text" id="my-field" data-formative-type="email" />

**Discussion:**

This option, `data-formative-type`, has nothing to do with the native HTML `<input>` element's `type` attribute.

This option will be ignored if `data-formative-pattern` is also set.

We plan to add support for more common field types in the future.

***

#### `data-formative-pattern`

**Description:**

A regular expression that Formative will use as the basis for evaluting the validity of the field's entered value.

**Acceptable values:**

Any JavaScript RegEx pattern string.

**Example:**

    <input type="text" id="my-field" data-formative-pattern="\d{5}([\-]\d{4})?" />

**Discussion:**

This option, `data-formative-pattern`, is only used internally by Formative, It does not affect or relate to the HTML5 `pattern` attribute in any way.

Be careful to specify the pattern as a string, and without delimiters:

- **Bad:** `/pattern/` or `"/pattern/"`.

- **Good:** `"pattern"` 

***

#### `data-formative-function`

**Description:**

A custom validation function that you supply to Formative.

**Acceptable values:**

A JavaScript function that returns `true` if the field's current value is valid, and `false` if it is invalid.

**Example:**

    $('#my-field').data('formativeFunction', function (field) {
      var value = field.val();
      var valid = false;
      if ( ... ) valid = true;
      return valid;
    });

**Discussion:**

When invoked by Formative, your function will be supplied with one argument that is a jQuery object representing the field's DOM element.

If set, this option overrides `data-formative-pattern`.

***

#### `data-formative-min-words`

**Description:**

Specifies a minimum word count for a field's value to be considered valid. 

**Acceptable values:**

Any positive integer less than `data-formative-max-words`, if set.

**Example:**

    <textarea id="my-field" data-formative-min-words="20" />

**Discussion:**

If set, this option overrides `data-formative-function`, and will be considered the sole criteria for evaluating field validity, unless `data-formative-max-words`is also set, in which case `data-formative-min-words` and `data-formative-max-words` will be applied together.

***

#### `data-formative-max-words`

**Description:**

Specifies a minimum word count for a field's value to be considered valid.

**Acceptable values:**

Any positive integer greater than `data-formative-min-words`, if set.

**Example:**

    <textarea id="my-field" data-formative-max-words="50" />

**Discussion:**

If set, this option overrides `data-formative-function`, and will be considered the sole criteria for evaluating field validity, unless `data-formative-min-words`is also set, in which case `data-formative-min-words` and `data-formative-max-words` will be applied together.


***

#### Summary: Order of priority for field validity specifiers

Each option, if set, will override all options below it.

1. `data-formative-min-words` and/or `data-formative-max-words`
2. `data-formative-function`
3. `data-formative-pattern`
4. `data-formative-type`
5. `data-formative-required`

***

### Useability enhancements

***

#### `data-formative-hop`

**Description:**

Automatically advance focus to the next blank or invalid field when the current field becomes valid. 

**Acceptable values:**

`true` or `false`.

**Example:**

    <input type="text" id="dob-month" data-formative-pattern="[0-9]{2}" data-formative-hop="true" />

**Discussion:**

Although they are technically valid, blank optional fields will not be skipped when advancing to the next invalid field.

***

#### `data-formative-keyboard`

**Description:**

Tells Mobile Safari to present a keyboard variant optimized for the specified kind of field. 

**Acceptable values:**

`"email"`: Present a keyboard variant optimized for email entry.

`"number"`: Present a keypad variant optimized for numeric digit entry.

**Example:**

    <input type="text" id="my-field" data-formative-keyboard="number" />

**Discussion:** These values may or may not work for touchscreen browsers other than Mobile Safari. I haven't tested any yet.

***

### Submission gatekeeping

***

#### `data-formative-error`

**Description:**

An error message to be displayed under the field if the user attempts to submit the form while the field is invalid.

**Acceptable values:**

An error message string.

**Example:**

    <input type="text" id="my-field" data-formative-error="You spelled your name wrong." />

**Discussion:**

For fields not inside a `.multi-field` container, the error will be displayed in its own `<div>` element immediately following the invalid field. The `<div>` will have class `formative-text-error`, and the `id` of the `<div>` that specified the error will be inserted as a second class. For example:

    <div>
      <input type="text" id="my-field" data-formative-error="You spelled your name wrong." />
      <div class="formative-text-error my-field">You spelled your name wrong.</div>
    </div>

For fields inside a `.multi-field`, no matter which of them is invalid, only one error will be displayed. That error is taken from the last field's `data-formative-error`. The error `<div>` will be placed after the last element inside the `.multi-field` wrapper:

    <div class="multi-field">
      <div>
	    <input type="text" id="my-field-1" />
	  </div>
	  <div>
        <input type="text" id="my-field-2" data-formative-error="You can do better." />
      </div>
      <div class="formative-text-error my-field">You can do better.</div>
    </div>

***

#### `data-formative-blah`

**Description:**

Blah. 

**Acceptable values:**

`blah`: Blah.

**Example:**

    <input type="text" id="my-field" data-formative-blah="blah" />

**Discussion:**

Blah.

***



## Configurable Formative options

### CSS style classes

If you'd prefer to use styles that are already defined in your own CSS files, or if you want to create new ones, you can set the names of the different CSS classes that Formative toggles on and off various types of elements to indidcate different validation states.





## Best practices

- Don't use the HTML5 pattern attibute.
- Add the `novalidate` attribute to your `<form>` elements.



- jump after pattern is complete!!!
- Option for single "full name" field that is automatically separated into first middle and last hidden fields.
- does not do anything for file inputs. should that be the case?
