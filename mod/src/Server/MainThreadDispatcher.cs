using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using UnityEngine;

namespace WorldboxMCP.Server
{
    public class MainThreadDispatcher : MonoBehaviour
    {
        private static MainThreadDispatcher? _instance;
        private readonly ConcurrentQueue<Action> _executionQueue = new ConcurrentQueue<Action>();

        public static MainThreadDispatcher Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("WorldboxMCP_Dispatcher");
                    DontDestroyOnLoad(go);
                    _instance = go.AddComponent<MainThreadDispatcher>();
                }
                return _instance;
            }
        }

        private void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else if (_instance != this)
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            while (_executionQueue.TryDequeue(out var action))
            {
                try
                {
                    action?.Invoke();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[WorldboxMCP] Error executing action on main thread: {ex}");
                }
            }
        }

        public void Enqueue(Action action)
        {
            if (action == null) return;
            _executionQueue.Enqueue(action);
        }

        public Task<T> EnqueueAsync<T>(Func<T> func)
        {
            var tcs = new TaskCompletionSource<T>();
            _executionQueue.Enqueue(() =>
            {
                try
                {
                    var result = func();
                    tcs.SetResult(result);
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            });
            return tcs.Task;
        }

        public Task EnqueueAsync(Action action)
        {
            var tcs = new TaskCompletionSource<bool>();
            _executionQueue.Enqueue(() =>
            {
                try
                {
                    action();
                    tcs.SetResult(true);
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            });
            return tcs.Task;
        }

        private void OnDestroy()
        {
            if (_instance == this)
            {
                _instance = null;
            }
        }
    }
}
