const commandUsage = new Map();
function incrementCommandUsage(commandName) {
  const currentUsage = commandUsage.get(commandName) || 0;
  commandUsage.set(commandName, currentUsage + 1);
}
function getCommandUsage(commandName) {
  return commandUsage.get(commandName) || 0;
}
module.exports = {
  incrementCommandUsage,
  getCommandUsage,
};