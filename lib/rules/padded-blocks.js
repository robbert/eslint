/**
 * @fileoverview A rule to ensure blank lines within blocks.
 * @author Mathias Schreck <https://github.com/lo1tuma>
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "require or disallow padding within blocks",
            category: "Stylistic Issues",
            recommended: false
        },

        schema: [
            {
                oneOf: [
                    {
                        enum: ["always", "never"]
                    },
                    {
                        type: "object",
                        properties: {
                            blocks: {
                                enum: ["always", "never"]
                            },
                            switches: {
                                enum: ["always", "never"]
                            },
                            classes: {
                                enum: ["always", "never"]
                            }
                        },
                        additionalProperties: false,
                        minProperties: 1
                    }
                ]
            }
        ]
    },

    create: function(context) {
        var options = {};
        var config = context.options[0] || "always";

        if (typeof config === "string") {
            options.blocks = config === "always";
        } else {
            if (config.hasOwnProperty("blocks")) {
                options.blocks = config.blocks === "always";
            }
            if (config.hasOwnProperty("switches")) {
                options.switches = config.switches === "always";
            }
            if (config.hasOwnProperty("classes")) {
                options.classes = config.classes === "always";
            }
        }

        var ALWAYS_MESSAGE = "Block must be padded by blank lines.",
            NEVER_MESSAGE = "Block must not be padded by blank lines.";

        var sourceCode = context.getSourceCode();

        /**
         * Gets the open brace token from a given node.
         * @param {ASTNode} node - A BlockStatement or SwitchStatement node from which to get the open brace.
         * @returns {Token} The token of the open brace.
         */
        function getOpenBrace(node) {
            if (node.type === "SwitchStatement") {
                return sourceCode.getTokenBefore(node.cases[0]);
            }
            return sourceCode.getFirstToken(node);
        }

        /**
         * Checks if the given parameter is a comment node
         * @param {ASTNode|Token} node An AST node or token
         * @returns {boolean} True if node is a comment
         */
        function isComment(node) {
            return node.type === "Line" || node.type === "Block";
        }

        /**
         * Finds the number of blank lines before or after the token.
         * @param {Token} token The token to check.
         * @param {number} dir Direction to look in: 1 is forwards, -1 is backwards.
         * @returns {number} Number of blank lines that are adjeaent to the token.
         */
        function getTokenPadding(token, dir) {
            var tokenLine = dir === 1 ? token.loc.start.line : token.loc.end.line,
                adjacentToken = token,
                adjacentTokenLine,
                nonBlankLine,
                blankLines;

            if (dir !== 1 && dir !== -1) {
                dir = 1;
            }

            do {
                adjacentToken = dir === 1
                    ? sourceCode.getTokenOrCommentAfter(adjacentToken)
                    : sourceCode.getTokenOrCommentBefore(adjacentToken);

                adjacentTokenLine = dir === 1
                    ? adjacentToken.loc.start.line
                    : adjacentToken.loc.end.line;
            } while (adjacentTokenLine === tokenLine && isComment(adjacentToken));

            nonBlankLine = adjacentToken.loc.start.line;
            blankLines = Math.abs(nonBlankLine - dir - tokenLine);

            return blankLines;
        }

        /**
         * Checks if a node should be padded, according to the rule config.
         * @param {ASTNode} node The AST node to check.
         * @returns {boolean} True if the node should be padded, false otherwise.
         */
        function requirePaddingFor(node) {
            switch (node.type) {
                case "BlockStatement":
                    return options.blocks;
                case "SwitchStatement":
                    return options.switches;
                case "ClassBody":
                    return options.classes;

                /* istanbul ignore next */
                default:
                    throw new Error("unreachable");
            }
        }

        /**
         * Checks the given BlockStatement node to be padded if the block is not empty.
         * @param {ASTNode} node The AST node of a BlockStatement.
         * @returns {void} undefined.
         */
        function checkPadding(node) {
            var openBrace = getOpenBrace(node),
                closeBrace = sourceCode.getLastToken(node),
                blockTopPadding = getTokenPadding(openBrace, 1),
                blockBottomPadding = getTokenPadding(closeBrace, -1),
                foundMsg = blockTopPadding > 1 ? " (" + blockTopPadding + " blank lines found)" : "";

            if (requirePaddingFor(node)) {
                if (!blockTopPadding) {
                    context.report({
                        node: node,
                        loc: { line: openBrace.loc.start.line, column: openBrace.loc.start.column },
                        message: ALWAYS_MESSAGE
                    });
                }
                if (!blockBottomPadding) {
                    context.report({
                        node: node,
                        loc: {line: closeBrace.loc.end.line, column: closeBrace.loc.end.column - 1 },
                        message: ALWAYS_MESSAGE
                    });
                }
            } else {
                if (blockTopPadding) {
                    context.report({
                        node: node,
                        loc: { line: openBrace.loc.start.line + 1, column: 0 },
                        message: NEVER_MESSAGE + foundMsg
                    });
                }

                if (blockBottomPadding) {
                    context.report({
                        node: node,
                        loc: {line: closeBrace.loc.end.line - 1, column: 0 },
                        message: NEVER_MESSAGE + foundMsg
                    });
                }
            }
        }

        var rule = {};

        if (options.hasOwnProperty("switches")) {
            rule.SwitchStatement = function(node) {
                if (node.cases.length === 0) {
                    return;
                }
                checkPadding(node);
            };
        }

        if (options.hasOwnProperty("blocks")) {
            rule.BlockStatement = function(node) {
                if (node.body.length === 0) {
                    return;
                }
                checkPadding(node);
            };
        }

        if (options.hasOwnProperty("classes")) {
            rule.ClassBody = function(node) {
                if (node.body.length === 0) {
                    return;
                }
                checkPadding(node);
            };
        }

        return rule;
    }
};
