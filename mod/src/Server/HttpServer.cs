using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;
using WorldboxMCP.Handlers;
using WorldboxMCP.Models;

namespace WorldboxMCP.Server
{
    public class HttpServer
    {
        private HttpListener? _listener;
        private Thread? _listenerThread;
        private bool _isRunning;
        private readonly int _port;

        public HttpServer(int port = 2828)
        {
            _port = port;
        }

        public void Start()
        {
            if (_isRunning) return;

            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
                _listener.Start();
                _isRunning = true;

                _listenerThread = new Thread(ListenLoop)
                {
                    IsBackground = true,
                    Name = "WorldboxMCP_HttpServer"
                };
                _listenerThread.Start();

                Debug.Log($"[WorldboxMCP] HTTP Server successfully started on http://127.0.0.1:{_port}/");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[WorldboxMCP] Failed to start HTTP Server: {ex.Message}");
            }
        }

        public void Stop()
        {
            _isRunning = false;
            try
            {
                _listener?.Stop();
                _listener?.Close();
            }
            catch { }
            Debug.Log("[WorldboxMCP] HTTP Server stopped.");
        }

        private void ListenLoop()
        {
            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    var context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(async _ => await ProcessRequestAsync(context));
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[WorldboxMCP] Error accepting HTTP connection: {ex.Message}");
                }
            }
        }

        private async Task ProcessRequestAsync(HttpListenerContext context)
        {
            var req = context.Request;
            var res = context.Response;

            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 200;
                res.Close();
                return;
            }

            try
            {
                string path = req.Url?.AbsolutePath.TrimEnd('/').ToLower() ?? "";
                string body = "";
                if (req.HasEntityBody)
                {
                    using var reader = new StreamReader(req.InputStream, req.ContentEncoding);
                    body = await reader.ReadToEndAsync();
                }

                object responseData;

                switch (path)
                {
                    case "/health":
                        responseData = new
                        {
                            status = "ok",
                            mapLoaded = MapBox.instance != null && MapBox.width > 0,
                            version = "1.0.0"
                        };
                        break;

                    case "/world/info":
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<WorldInfoDto>.Ok(WorldHandler.GetWorldInfo()));
                        break;

                    case "/world/tile":
                        if (req.HttpMethod == "GET")
                        {
                            int.TryParse(req.QueryString["x"], out int x);
                            int.TryParse(req.QueryString["y"], out int y);
                            responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                                ApiResponse<TileInfoDto>.Ok(WorldHandler.InspectTile(x, y)));
                        }
                        else
                        {
                            var modReq = JsonConvert.DeserializeObject<ModifyTileRequest>(body);
                            if (modReq == null) throw new ArgumentException("Invalid modify tile payload.");
                            responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                                ApiResponse<bool>.Ok(WorldHandler.ModifyTile(modReq), "Tile modified"));
                        }
                        break;

                    case "/world/speed":
                        var speedReq = JsonConvert.DeserializeObject<GameSpeedRequest>(body);
                        if (speedReq == null) throw new ArgumentException("Invalid speed payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<bool>.Ok(WorldHandler.SetGameSpeed(speedReq.Speed), $"Speed set to {speedReq.Speed}"));
                        break;

                    case "/world/broadcast":
                        var bcastReq = JsonConvert.DeserializeObject<BroadcastMessageRequest>(body);
                        if (bcastReq == null) throw new ArgumentException("Invalid broadcast payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<bool>.Ok(WorldHandler.BroadcastMessage(bcastReq.Message), "Message broadcasted"));
                        break;

                    case "/kingdoms":
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<System.Collections.Generic.List<KingdomDto>>.Ok(DiplomacyHandler.GetKingdoms()));
                        break;

                    case "/cities":
                        string? kFilter = req.QueryString["kingdom"];
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<System.Collections.Generic.List<CityDto>>.Ok(DiplomacyHandler.GetCities(kFilter)));
                        break;

                    case "/diplomacy/war":
                        var warReq = JsonConvert.DeserializeObject<WarRequest>(body);
                        if (warReq == null) throw new ArgumentException("Invalid war payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<bool>.Ok(DiplomacyHandler.DeclareWar(warReq.AttackerKingdom, warReq.DefenderKingdom), "War started"));
                        break;

                    case "/diplomacy/peace":
                        var peaceReq = JsonConvert.DeserializeObject<PeaceRequest>(body);
                        if (peaceReq == null) throw new ArgumentException("Invalid peace payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<bool>.Ok(DiplomacyHandler.MakePeace(peaceReq.Kingdom1, peaceReq.Kingdom2), "Peace treaty signed"));
                        break;

                    case "/units":
                        int.TryParse(req.QueryString["limit"] ?? "50", out int limit);
                        string? unitKingdom = req.QueryString["kingdom"];
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<System.Collections.Generic.List<UnitDto>>.Ok(UnitHandler.GetUnits(limit, unitKingdom)));
                        break;

                    case "/units/spawn":
                        var spawnReq = JsonConvert.DeserializeObject<SpawnUnitRequest>(body);
                        if (spawnReq == null) throw new ArgumentException("Invalid spawn payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<UnitDto>.Ok(UnitHandler.SpawnUnit(spawnReq), "Unit spawned"));
                        break;

                    case "/units/modify":
                        var modifyReq = JsonConvert.DeserializeObject<ModifyUnitRequest>(body);
                        if (modifyReq == null) throw new ArgumentException("Invalid modify payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<UnitDto>.Ok(UnitHandler.ModifyUnit(modifyReq), "Unit modified"));
                        break;

                    case "/powers/drop":
                        var powerReq = JsonConvert.DeserializeObject<TriggerPowerRequest>(body);
                        if (powerReq == null) throw new ArgumentException("Invalid power payload.");
                        responseData = await MainThreadDispatcher.Instance.EnqueueAsync(() =>
                            ApiResponse<bool>.Ok(PowerHandler.TriggerPower(powerReq), $"Power {powerReq.PowerId} dropped"));
                        break;

                    default:
                        res.StatusCode = 404;
                        responseData = ApiResponse<object>.Fail($"Endpoint '{path}' not found.");
                        break;
                }

                string jsonResponse = JsonConvert.SerializeObject(responseData, Formatting.Indented);
                byte[] buffer = Encoding.UTF8.GetBytes(jsonResponse);
                res.ContentType = "application/json";
                res.ContentLength64 = buffer.Length;
                await res.OutputStream.WriteAsync(buffer, 0, buffer.Length);
            }
            catch (Exception ex)
            {
                res.StatusCode = 500;
                string errJson = JsonConvert.SerializeObject(ApiResponse<object>.Fail(ex.Message));
                byte[] errBuffer = Encoding.UTF8.GetBytes(errJson);
                res.ContentType = "application/json";
                res.ContentLength64 = errBuffer.Length;
                try
                {
                    await res.OutputStream.WriteAsync(errBuffer, 0, errBuffer.Length);
                }
                catch { }
            }
            finally
            {
                try { res.Close(); } catch { }
            }
        }
    }
}
