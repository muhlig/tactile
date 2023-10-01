import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { buildNumberWidget } from './common.js';

export const LayoutPage = GObject.registerClass(
class LayoutPage extends Adw.PreferencesPage {
    _init(settings, n) {
        this._settings = settings;
        this._n = n;

        super._init({
            title: `Layout ${this._n}`,
            name: `LayoutPage${this._n}`,
        });

        const grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            margin_start: 12,
            margin_end: 12,
            margin_top: 12,
            margin_bottom: 12,
            column_spacing: 12,
            row_spacing: 12,
            visible: true
        });

        const weightsLabel = new Gtk.Label({
            label: '<b>Column/row weights</b>',
            use_markup: true,
            visible: true
        });
        grid.attach(weightsLabel, 0, 0, 1, 1);
        grid.attach(buildWeightsWidget(settings, n), 0, 1, 1, 1);

        // Recreate WeightsWidget when grid size changes
        function recreateWeightsWidget() {
            grid.remove(grid.get_child_at(0, 1));
            grid.attach(buildWeightsWidget(settings, n), 0, 1, 1, 1);
        }
        settings.connect('changed::grid-cols', recreateWeightsWidget);
        settings.connect('changed::grid-rows', recreateWeightsWidget);

        const weightsFootnote = new Gtk.Label({
            label: 'Tip: Set weight to 0 to remove any column/row from this layout',
            visible: true
        });
        grid.attach(weightsFootnote, 0, 2, 1, 1);

        const group = new Adw.PreferencesGroup();
        group.add(grid);
        this.add(group);
    }
});

function buildWeightsWidget(settings, n) {
    const num_cols = settings.get_int('grid-cols');
    const num_rows = settings.get_int('grid-rows');

    const grid = new Gtk.Grid({
        halign: Gtk.Align.CENTER,
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    const prefix = layoutPrefix(n);

    // Column weights
    for (let col = 0; col < num_cols; col++) {
        const widget = buildNumberWidget(settings, `${prefix}col-${col}`)
        grid.attach(widget, col + 1, 0, 1, 1);
    }

    // Row weights
    for (let row = 0; row < num_rows; row++) {
        const widget = buildNumberWidget(settings, `${prefix}row-${row}`)
        grid.attach(widget, 0, row + 1, 1, 1);
    }

    // Preview
    const preview = buildPreviewWidget(settings, n);
    grid.attach(preview, 1, 1, num_cols, num_rows);

    return grid;
}

function buildPreviewWidget(settings, n) {
    const grid = new Gtk.Grid({
        column_homogeneous: true,
        row_homogeneous: true,
        visible: true
    });

    let tiles = [];

    function discardTiles() {
        tiles.forEach(tile => grid.remove(tile));
        tiles = [];
    }

    function createTiles() {
        const layout = loadLayout(settings, n);

        layout.cols.forEach((col_weight, col) => {
            layout.rows.forEach((row_weight, row) => {
                if (col_weight < 1 || row_weight < 1) {
                    return;
                }
                const id = `tile-${col}-${row}`;
                const name = settings.get_strv(id)[0] || '';
                const area = calculateArea(layout, col, row);

                const tile = new Gtk.Label({
                    halign: Gtk.Align.FILL,
                    label: name.toUpperCase(),
                    visible: true
                });
                tile.get_style_context().add_class("tile");

                grid.attach(tile, area.x, area.y, area.width, area.height);
                tiles.push(tile);
            });
        });

        if (tiles.length < 1) {
            const tile = new Gtk.Label({
                halign: Gtk.Align.FILL,
                label: 'Error: No tiles',
                visible: true
            });
            tile.get_style_context().add_class('error-tile');

            grid.attach(tile, 0, 0, 1, 1);
            tiles.push(tile);
        }
    }

    createTiles();

    settings.connect('changed', () => {
        discardTiles();
        createTiles();
    })

    return grid;
}

function layoutPrefix(n) {
    // For legacy reasons, layout 1 does not have a prefix
    if (n === 1) {
        return "";
    }
    return `layout-${n}-`;
}

function loadLayout(settings, n) {
    const num_cols = settings.get_int('grid-cols');
    const num_rows = settings.get_int('grid-rows');

    const cols = [], rows = [];
    const prefix = layoutPrefix(n);

    for (let col = 0; col < num_cols; col++) {
        cols.push(settings.get_int(`${prefix}col-${col}`));
    }
    for (let row = 0; row < num_rows; row++) {
        rows.push(settings.get_int(`${prefix}row-${row}`));
    }

    return {cols: cols, rows: rows};
}

function calculateArea(layout, col, row) {
    const colStart = sumUntil(layout.cols, col);
    const rowStart = sumUntil(layout.rows, row);
    const colEnd = sumUntil(layout.cols, col + 1);
    const rowEnd = sumUntil(layout.rows, row + 1);
    return {x: colStart, y: rowStart, width: colEnd - colStart, height: rowEnd - rowStart};
}

function sumUntil(list, index) {
    return list.reduce((prev, curr, i) => i < index ? prev + curr : prev, 0);
}
