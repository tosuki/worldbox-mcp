using System;
using NeoModLoader.api;
using WorldboxMCP.Server;

namespace WorldboxMCP
{
    public class Main : BasicMod<Main>
    {
        private static HttpServer? _server;

        protected override void OnModLoad()
        {
            LogInfo("[WorldboxMCP] Initializing WorldboxMCP Mod via NeoModLoader...");

            try
            {
                // Ensure the MainThreadDispatcher is initialized
                var dispatcher = MainThreadDispatcher.Instance;

                // Start HTTP Server on port 2828
                _server = new HttpServer(2828);
                _server.Start();

                LogInfo("[WorldboxMCP] WorldboxMCP Mod initialized successfully! Listening on http://127.0.0.1:2828/");
            }
            catch (Exception ex)
            {
                LogError($"[WorldboxMCP] Failed to start HTTP server: {ex}");
            }
        }

        private void OnDestroy()
        {
            _server?.Stop();
        }
    }
}
