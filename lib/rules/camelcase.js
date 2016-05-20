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
         * Reports an AST node as a rule violation.
         * @param {ASTNode} node The node to report.
         * @returns {void}
         * @private
         */
        function report(node) {
            if (reported.indexOf(node) < 0) {
                reported.push(node);
                context.report(node, "Identifier '{{name}}' is not in camel case.", { name: node.name });
            }
        }

        var options = context.options[0] || {},
            properties = options.properties || "";

        if (properties !== "always" && properties !== "never") {
            properties = "always";
        }

        return {

            Identifier: function(node) {

                var effectiveParent;

                // Never report a CallExpression
                if (node.parent.type === "CallExpression") {
                    return;
                }

                if (!isSnakeCase(node.name)) {
                    return;
                }

                if (properties !== "never") {

                    // MemberExpressions get special rules
                    if (node.parent.type === "MemberExpression") {

                        effectiveParent = node.parent.parent;

                        // Always report underscored object names
                        if (node.parent.object.type === "Identifier" &&
                                node.parent.object.name === node.name) {

                            // Report

                        // Report AssignmentExpressions only if they are the left side of the assignment
                        } else if (effectiveParent.type === "AssignmentExpression" &&
                                (effectiveParent.right.type !== "MemberExpression" ||
                                effectiveParent.left.type === "MemberExpression" &&
                                effectiveParent.left.property.name === node.name)) {

                            // Report
                        } else {
                            return;
                        }

                    // Properties have their own rules
                    } else if (node.parent.type === "Property") {

                        if (node.parent.parent && node.parent.parent.type === "ObjectPattern" &&
                                node.parent.key === node && node.parent.value !== node) {
                            return;
                        }
                    }
                }

                report(node);
            }

        };

    }
};
