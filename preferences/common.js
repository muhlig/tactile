import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

// TODO check if there's an alternative in Adw
export function buildNumberWidget(settings, id, min = 0, max = 1000) {
    const spin = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: min,
            upper: max,
            step_increment: 1
        }),
        visible: true
    });
    settings.bind(id, spin, 'value', Gio.SettingsBindFlags.DEFAULT);
    return spin;
}

