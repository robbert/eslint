/**
 * @fileoverview Rule to flag when using constructor without parentheses
 * @author Ilya Volodin
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "require parentheses when invoking a constructor with no arguments",
            category: "Stylistic Issues",
            recommended: false
        },

        fixable: "code",

        schema: []
    },

    create: function(context) {
        var sourceCode = context.getSourceCode();

        /**
         * Create a token value tester function.
         * @param {*} value The required value
         * @returns {function(AST_Token):boolean} True when the token has the required value.
         */
        function isValue(value) {

            /**
             * @param {AST_Token} token Token to test
             * @returns {boolean} True when the token has the required value.
             */
            return function(token) {
                return token.value === value;
            };
        }

        return {

            NewExpression: function(node) {
                var tokens = sourceCode.getTokens(node);
                var parens = tokens.some(isValue("("))
                          && tokens.some(isValue(")"));

                if (!parens) {
                    context.report({
                        node: node,
                        message: "Missing '()' invoking a constructor",
                        fix: function(fixer) {
                            return fixer.insertTextAfter(node, "()");
                        }
                    });
                }
            }
        };

    }
};
