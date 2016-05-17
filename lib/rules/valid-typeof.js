/**
 * @fileoverview Ensures that the results of typeof are compared against a valid string
 * @author Ian Christian Myers
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce comparing `typeof` expressions against valid strings",
            category: "Possible Errors",
            recommended: true
        },

        schema: [
            {
                type: "object",
                properties: {
                    allow: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        minItems: 1,
                        uniqueItems: true
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {

        var VALID_TYPES = ["symbol", "undefined", "object", "boolean", "number", "string", "function"],
            OPERATORS = ["==", "===", "!=", "!=="];

        var customTypes = context.options[0] && Array.isArray(context.options[0].allow)
            ? context.options[0].allow
            : [];

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        return {

            UnaryExpression: function(node) {
                var parent, sibling;

                if (node.operator === "typeof") {
                    parent = context.getAncestors().pop();

                    if (parent.type === "BinaryExpression" && OPERATORS.indexOf(parent.operator) !== -1) {
                        sibling = parent.left === node ? parent.right : parent.left;

                        if (sibling.type === "Literal") {

                            if (
                                VALID_TYPES.indexOf(sibling.value) === -1 &&
                                customTypes.indexOf(sibling.value) === -1
                            ) {
                                context.report(sibling, "Invalid typeof comparison value");
                            }
                        }
                    }
                }
            }

        };

    }
};
