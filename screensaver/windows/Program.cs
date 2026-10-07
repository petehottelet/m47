using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        string mode = args.Length == 0 ? "/c" : args[0].ToLowerInvariant();
        if (mode == "--self-test")
        {
            return PreviewHandle(new[] { "/p", "1234" }) == new IntPtr(1234)
                && PreviewHandle(new[] { "/p:5678" }) == new IntPtr(5678)
                && PreviewHandle(new[] { "/p", "invalid" }) == IntPtr.Zero ? 0 : 1;
        }
        bool smoke = mode == "--smoke-test";
        bool preview = mode.StartsWith("/p");
        IntPtr parent = preview ? PreviewHandle(args) : IntPtr.Zero;
        if (preview && (parent == IntPtr.Zero || !Native.IsWindow(parent))) return 1;
        try
        {
            if (mode == "/s")
            {
                foreach (Screen screen in Screen.AllScreens)
                    new SaverWindow(screen.Bounds, true, IntPtr.Zero, false, null).Show();
                Application.Run();
            }
            else
            {
                if (!(smoke || preview || mode.StartsWith("/c") || mode == "--window")) return 1;
                var bounds = new Rectangle(0, 0, 1280, 800);
                var window = new SaverWindow(bounds, false, parent, smoke, smoke && args.Length > 1 ? args[1] : null);
                Application.Run(window);
            }
            return Environment.ExitCode;
        }
        catch
        {
            if (!smoke) MessageBox.Show("M47 could not start. Keep the screensaver and its companion files together, and install the Microsoft Edge WebView2 Runtime.", "M47 screensaver");
            return 1;
        }
    }

    private static IntPtr PreviewHandle(string[] args)
    {
        string value = args[0].Contains(":") ? args[0].Substring(args[0].IndexOf(':') + 1) : args.Length > 1 ? args[1] : "";
        long handle;
        return long.TryParse(value.Trim(), out handle) && handle > 0 ? new IntPtr(handle) : IntPtr.Zero;
    }
}

internal sealed class SaverWindow : Form
{
    private readonly WebView2 web = new WebView2();
    private readonly Timer timer = new Timer();
    private readonly bool saver;
    private readonly bool smoke;
    private readonly IntPtr parent;
    private readonly string smokeOutput;
    private readonly DateTime started = DateTime.UtcNow;
    private Point mouseOrigin;
    private uint inputTime;

    public SaverWindow(Rectangle bounds, bool saver, IntPtr parent, bool smoke, string smokeOutput)
    {
        this.saver = saver; this.parent = parent; this.smoke = smoke; this.smokeOutput = smokeOutput;
        Text = saver ? "M47 screensaver" : "M47 screensaver — settings and preview";
        BackColor = Color.Black;
        StartPosition = FormStartPosition.Manual;
        Bounds = bounds;
        FormBorderStyle = saver || parent != IntPtr.Zero || smoke ? FormBorderStyle.None : FormBorderStyle.Sizable;
        if (saver) { TopMost = true; ShowInTaskbar = false; Cursor.Hide(); }
        else if (parent == IntPtr.Zero && !smoke) StartPosition = FormStartPosition.CenterScreen;
        if (smoke) { ShowInTaskbar = false; Location = new Point(-30000, -30000); }
        web.Dock = DockStyle.Fill;
        Controls.Add(web);
        mouseOrigin = Cursor.Position;
        inputTime = Native.LastInput();
        timer.Interval = 150;
        timer.Tick += Tick;
        timer.Start();
        Shown += async (sender, e) => await Initialize();
        FormClosed += (sender, e) => { timer.Dispose(); web.Dispose(); if (saver) { Cursor.Show(); Application.Exit(); } };
    }

    protected override bool ShowWithoutActivation { get { return smoke || parent != IntPtr.Zero; } }

    private async Task Initialize()
    {
        try
        {
            if (parent != IntPtr.Zero)
            {
                Native.SetParent(Handle, parent);
                Native.SetWindowLong(Handle, -16, (Native.GetWindowLong(Handle, -16) & ~0x80000000L) | 0x40000000L);
                FitPreview();
            }
            string assets = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "web");
            if (!File.Exists(Path.Combine(assets, "screensaver.html"))) throw new IOException();
            string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "M47", "Screensaver", "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(null, profile);
            await web.EnsureCoreWebView2Async(environment);
            web.CoreWebView2.SetVirtualHostNameToFolderMapping("m47.invalid", assets, CoreWebView2HostResourceAccessKind.DenyCors);
            web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            web.CoreWebView2.Settings.IsStatusBarEnabled = false;
            web.CoreWebView2.Settings.IsZoomControlEnabled = false;
            web.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = false;
            web.CoreWebView2.Settings.IsPasswordAutosaveEnabled = false;
            web.CoreWebView2.Settings.IsGeneralAutofillEnabled = false;
            web.CoreWebView2.PermissionRequested += (sender, e) => e.State = CoreWebView2PermissionState.Deny;
            web.CoreWebView2.NewWindowRequested += (sender, e) => e.Handled = true;
            Rectangle windowBounds = Bounds;
            web.CoreWebView2.ContainsFullScreenElementChanged += (sender, e) => {
                if (saver || parent != IntPtr.Zero || smoke) return;
                if (web.CoreWebView2.ContainsFullScreenElement) {
                    windowBounds = Bounds; FormBorderStyle = FormBorderStyle.None;
                    Bounds = Screen.FromControl(this).Bounds;
                } else { FormBorderStyle = FormBorderStyle.Sizable; Bounds = windowBounds; }
            };
            web.CoreWebView2.NavigationStarting += (sender, e) => { if (!IsLocal(e.Uri)) e.Cancel = true; };
            web.CoreWebView2.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All);
            web.CoreWebView2.WebResourceRequested += (sender, e) => {
                if (!IsLocal(e.Request.Uri) && !IsPublicFeed(e.Request.Uri)) e.Response = environment.CreateWebResourceResponse(new MemoryStream(), 403, "Blocked", "Content-Type: text/plain");
            };
            web.CoreWebView2.NavigationCompleted += async (sender, e) => {
                if (!smoke) return;
                try
                {
                    await Task.Delay(1200);
                    string result = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify({title:document.title,scene:!!document.querySelector('#display svg'),purpose:document.querySelector('#display svg')?.dataset.purpose,local:location.hostname==='m47.invalid'})");
                    if (smokeOutput != null) File.WriteAllText(smokeOutput, result);
                    Environment.ExitCode = result.Contains("\\\"scene\\\":true") && result.Contains("\\\"local\\\":true") ? 0 : 1;
                }
                catch { Environment.ExitCode = 1; }
                Close();
            };
            bool quiet = saver || parent != IntPtr.Zero || smoke;
            web.Source = new Uri("https://m47.invalid/screensaver.html" + (quiet ? "?native=1&seed=" + Guid.NewGuid().ToString("N") : ""));
            timer.Start();
        }
        catch
        {
            Environment.ExitCode = 1;
            if (!smoke && !saver && parent == IntPtr.Zero)
                MessageBox.Show("M47 needs the Microsoft Edge WebView2 Runtime and the web folder beside M47.scr. No settings were changed.", "M47 screensaver");
            Close();
        }
    }

    private static bool IsLocal(string address)
    {
        Uri uri;
        return Uri.TryCreate(address, UriKind.Absolute, out uri) && uri.Scheme == "https" && uri.Host == "m47.invalid";
    }
    private static bool IsPublicFeed(string address)
    {
        return address == "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
            || address == "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
    }
    private void FitPreview()
    {
        Native.Rect size;
        if (!Native.IsWindow(parent) || !Native.GetClientRect(parent, out size)) { Close(); return; }
        Bounds = new Rectangle(0, 0, Math.Max(1, size.Right), Math.Max(1, size.Bottom));
    }
    private void Tick(object sender, EventArgs e)
    {
        if (parent != IntPtr.Zero) FitPreview();
        if (smoke && (DateTime.UtcNow - started).TotalSeconds > 30) { Environment.ExitCode = 1; Close(); }
        if (!saver) return;
        if ((DateTime.UtcNow - started).TotalSeconds < 2) { mouseOrigin = Cursor.Position; inputTime = Native.LastInput(); return; }
        if (Native.LastInput() != inputTime || Math.Abs(Cursor.Position.X - mouseOrigin.X) > 4 || Math.Abs(Cursor.Position.Y - mouseOrigin.Y) > 4) Application.Exit();
    }
}

internal static class Native
{
    [StructLayout(LayoutKind.Sequential)] internal struct Rect { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] private struct LastInputInfo { public uint Size, Time; }
    [DllImport("user32.dll")] internal static extern bool IsWindow(IntPtr window);
    [DllImport("user32.dll")] internal static extern bool GetClientRect(IntPtr window, out Rect rect);
    [DllImport("user32.dll")] internal static extern IntPtr SetParent(IntPtr child, IntPtr parent);
    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] private static extern IntPtr GetStyle(IntPtr window, int index);
    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")] private static extern IntPtr SetStyle(IntPtr window, int index, IntPtr value);
    [DllImport("user32.dll")] private static extern bool GetLastInputInfo(ref LastInputInfo value);
    internal static long GetWindowLong(IntPtr window, int index) { return GetStyle(window, index).ToInt64(); }
    internal static void SetWindowLong(IntPtr window, int index, long value) { SetStyle(window, index, new IntPtr(value)); }
    internal static uint LastInput() { var value = new LastInputInfo { Size = 8 }; return GetLastInputInfo(ref value) ? value.Time : 0; }
}
