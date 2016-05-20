/**
 * @fileoverview Rule to flag non-camelcased identifiers
 * @author Nicholas C. Zakas
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce camelcase naming convention",
            category: "Stylistic Issues",
            recommended: false
        },

        fixable: "code",

        schema: [
            {
                type: "object",
                properties: {
                    properties: {
                        enum: ["always", "never"]
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {

        //--------------------------------------------------------------------------
        // Helpers
        //--------------------------------------------------------------------------

        // contains reported nodes to avoid reporting twice on destructuring with shorthand notation
        var reported = [];

        /**
         * Should be false for:
         * ["_x", "_x_", "x_", "__x", "x__", "__x__"]
         * Should be `true` for:
         * ["x_y", "_x_y", "_x_y_", "__x__y__", "x_y_", "x_y__", "x__y__"]
         * @const {RegExp}
         */
        var NON_SURROUNDING_UNDERSCORE = /^_*[^_]+(_+)(?!_*$)/g;

        // TODO: Surrogate pair support
        var SNAKE_LETTER = /^(_*[^_]+)_+(.)(?:(?!_*$)|$)/g;

        /**
         * Checks if a string contains only uppercase characters
         * @param {string} name The string to check.
         * @returns {string} True when uppercase
         * @private
         */
        function isUpperCase(name) {
            return name === name.toUpperCase();
        }

        /**
         * Checks if a string contains an underscore and isn't all upper-case.
         *
         * Exclude protected/private prefix underscores, e.g.:
         *
         *   - `__setPassword()`
         *   - `_protectedState`
         *
         * Exclude constant casing, e.g.:
         *
         *   - `__LINE`
         *   - `PRODUCT_VERSION`
         *   - `__dir__`
         *
         * @see https://en.wikipedia.org/wiki/Snake_case
         *
         * @param {String} name The string to check.
         * @returns {boolean} if the string is underscored
         * @private
         */
        function isSnakeCase(name) {
            return NON_SURROUNDING_UNDERSCORE.test(name)
                && !isUpperCase(name);
        }

        /**
         * Convert `snake_cased` identifiers to `camelCased` identifiers.
         * Should not affect strings that are not snake_cased.
         * @param {string} name A `snake_cased` string
         * @returns {string} The `camelCased` string
         */
        function snakeToCamelCase(name) {
            return name.replace(SNAKE_LETTER, function toUpperCase(_, prefix, letter) {
                return prefix + letter.toUpperCase();
            });
        }

        /**
         * Reports an AST node as a rule violation.
         * @param {Object} obj Object with the node to report.
         * @returns {void}
         * @private
         */
        function report(obj) {
            if (reported.indexOf(obj.node) !== -1) {
                return;
            }

            reported.push(obj.node);
            context.report(obj);
        }

        var options = context.options[0] || {},
            properties = options.properties || "";

        if (properties !== "always" && properties !== "never") {
            properties = "always";
        }

        return {

            Identifier: function(node) {

                var effectiveParent;

                // Prevent duplicate reports by ignoring references.
                // But when fixing the casing, we should update every instance.
                var isReference = false;

                if (!isSnakeCase(node.name)) {
                    return;
                }

                // Never report a CallExpression
                if (node.parent.type === "CallExpression") {
                    isReference = true;
                }

                if (properties !== "never") {

                    // MemberExpressions get special rules
                    if (node.parent.type === "MemberExpression") {

                        effectiveParent = node.parent.parent;

                        // Always report underscored object names
                        if (node.parent.object.type === "Identifier" &&
                                node.parent.object.name === node.name) {

                            isReference = false;

                        // Report AssignmentExpressions only if they are the left side of the assignment
                        } else if (effectiveParent.type === "AssignmentExpression" &&
                                (effectiveParent.right.type !== "MemberExpression" ||
                                effectiveParent.left.type === "MemberExpression" &&
                                effectiveParent.left.property.name === node.name)) {

                            // Report
                            isReference = false;
                        } else {
                            isReference = true;
                        }

                    // Properties have their own rules
                    } else if (node.parent.type === "Property") {

                        if (node.parent.parent && node.parent.parent.type === "ObjectPattern" &&
                                node.parent.key === node && node.parent.value !== node) {
                            isReference = true;
                        }
                    }
                }

                // TODO: Don't bail out when running with `--fix`, then all errors need to be reported.
                if (isReference) {
                    return;
                }

                report({
                    node: node,
                    message: "Identifier '{{name}}' is not in camel case.",
                    data: { name: node.name },

                    fix: function(fixer) {
                        return fixer.replaceText(node, snakeToCamelCase(node.name));
                    }
                });
            }

        };

    }
};
