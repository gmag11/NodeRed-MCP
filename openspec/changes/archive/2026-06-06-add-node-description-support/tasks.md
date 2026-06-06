## 1. Skill Documentation

- [x] 1.1 Add a "Common Node Properties" section at the top of `nodered-node-reference/SKILL.md` explaining that `info` (labeled "Description" in the Node-RED editor UI) is a universal field available on most node types — describable via `get-node-detail`, settable via `update-node`/`create-node` with `properties: { info: "text" }`
- [x] 1.2 Update the `comment` node entry in `nodered-node-reference/SKILL.md` to reference the common properties section instead of listing `info` as comment-only
- [x] 1.3 Add a note in `nodered-flow-builder/SKILL.md` (if applicable) that descriptions can be added to any node via `info`

## 2. Tool Descriptions

- [x] 2.1 Update `update-node` tool description in `src/server.js` to mention `info` as a standard property (alongside `name`) — include the UI name "Description"
- [x] 2.2 Update `get-node-detail` tool description in `src/server.js` to note that the response includes the `info` field (node description)

## 3. Validation

- [x] 3.1 Verify with a curl call that `update-node` successfully sets `info` on a test node and the value is reflected in the Node-RED UI's Description field
- [x] 3.2 Spot-check that the updated skill docs mention `info` as "Description" in the editor UI so an LLM can map user phrases like "add a description to this node" to `properties: { info: "..." }`
