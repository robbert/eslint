# Backwards Compatibility

Balancing the trade-offs of improving a tool and the frustration these changes can cause is a difficult task. One key area in which this affects our users is in the replacement of one rule by another.

The ESLint team is committed to making upgrading as easy and painless as possible. To that end, the team has agreed upon some guidelines for replacing rules in the future. The goal of these guidelines is to allow for improvements and changes to be made without breaking existing configurations.

For the next year, the team has committed to not remove any rules in any releases of ESLint; however, the team will deprecate rules as needed. When a rule is deprecated, it means that:

* The team will no longer work on the rule. This includes bug fixes, enhancements, and updates to the rule's documentation. Any issues/pull requests related to the deprecated rule will not be accepted and will be closed automatically with a message referring to the rule that replaces it.
* The rule is moved to a list of deprecated rules rather than being on the main rule page. Additionally, the rule will be labeled as deprecated on the rule's documentation page.

After the year has passed, the team will then revisit all deprecated rules and evaluate whether they should actually be removed or not. If the rule is removed at this time, users will have to adjust their configuration accordingly.
