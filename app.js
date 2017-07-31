import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, ListView, Keyboard, AsyncStorage } from 'react-native';
import Header from './header';
import Footer from './footer';
import Row from './row';

const filterItems = (filter, items) => {
    return items.filter((item) => {
        if (filter === 'ALL') return true;
        if (filter === 'ACTIVE') return !item.complete;
        if (filter === 'COMPLETED') return item.complete;
    })
};

class App extends Component {
    constructor(props) {
        super(props);
        const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        this.state = {
            allComplete: false,
            value: "",
            items: [],
            dataSource: ds.cloneWithRows([]),
            filter: 'ALL',
            loading: true,
        };

        this.handleFilter = this.handleFilter.bind(this);
        this.handleAddItem = this.handleAddItem.bind(this);
        this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this);
        this.setSource = this.setSource.bind(this);
        this.handleToggleComplete = this.handleToggleComplete.bind(this);
        this.handleRemoveItem = this.handleRemoveItem.bind(this);
        this.handleClearCompleted = this.handleClearCompleted.bind(this);
        this.handleUpdateText = this.handleUpdateText.bind(this);
        this.handleToggleEditing = this.handleToggleEditing.bind(this);
    }
    componentWillMount() {
        AsyncStorage.getItem('items').then((json) => {
            try {
                const items = JSON.parse(json);
                this.setSource(items, items, { loading: false });
            } catch (e) {
                this.setState({
                    loading: false,
                });
            }
        });
    }
    handleAddItem() {
        if (!this.state.value) return;
        const newItems = [
            ...this.state.items,
            {
                key: Date.now(),
                text: this.state.value,
                complete: false,
                editing: false,
            }
        ];
        this.setSource(newItems, filterItems(this.state.filter, newItems), { value: '' });
    }
    handleToggleComplete(key, complete) {
        const newItems = this.state.items.map((item) => {
            if (item.key !== key) return item;
            return { ...item, complete };
        });
        this.setSource(newItems, filterItems(this.state.filter, newItems));
    }
    handleRemoveItem(key) {
        const newItems = this.state.items.filter((item) => item.key !== key);
        this.setSource(newItems, filterItems(this.state.filter, newItems));
    }
    handleClearCompleted() {
        const newItems = filterItems('ACTIVE', this.state.items);
        this.setSource(newItems, filterItems(this.state.filter, newItems));
    }
    handleToggleAllComplete() {
        const complete = !this.state.allComplete;
        const newItems = this.state.items.map((item) => ({
            ...item,
            complete,
        }));
        this.setSource(newItems, filterItems(this.state.filter, newItems), { allComplete: complete });
    }
    handleFilter(filter) {
        this.setSource(this.state.items, filterItems(filter, this.state.items), { filter });
    }
    handleUpdateText(key, text) {
        const newItems = this.state.items.map((item) => {
            if (item.key !== key) return item;
            return {
                ...item,
                text,
            };
        });
        this.setSource(newItems, filterItems(this.state.filter, newItems));
    }
    handleToggleEditing(key, editing) {
        const newItems = this.state.items.map((item) => {
            if (item.key !== key) return item;
            return {
                ...item,
                editing,
            };
        });
        this.setSource(newItems, filterItems(this.state.filter, newItems));
    }
    setSource(items, itemsDatasource, otherState = {}) {
        this.setState({
            items,
            dataSource: this.state.dataSource.cloneWithRows(itemsDatasource),
            ...otherState,
        });
        AsyncStorage.setItem('items', JSON.stringify(items));
    }
    render () {
        return (
            <View style={styles.container}>
                <Header
                    value={this.state.value}
                    onAddItem={this.handleAddItem}
                    onChange={(value) => this.setState({ value })}
                    onToggleAllComplete={this.handleToggleAllComplete}
                />
                <View style={styles.content}>
                    <ListView
                        style={styles.list}
                        enableEmptySections
                        dataSource={this.state.dataSource}
                        onScroll={() => Keyboard.dismiss()}
                        renderRow={({ key, ...value }) => {
                            return (
                                <Row
                                    key={key}
                                    {...value}
                                    onComplete={(complete) => this.handleToggleComplete(key, complete)}
                                    onRemove={() => this.handleRemoveItem(key)}
                                    onUpdate={(text) => this.handleUpdateText(key, text)}
                                    onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                                />
                            );
                        }}
                        renderSeparator={(sectionId, rowId) => {
                            return (<View key={rowId} style={styles.separator} />);
                        }}
                    />
                </View>
                <Footer
                    count={filterItems("ACTIVE", this.state.items).length}
                    filter={this.state.filter}
                    onFilter={this.handleFilter}
                    onClearCompleted={this.handleClearCompleted}
                />
                {this.state.loading && <View style={styles.loading}>
                    <ActivityIndicator
                        animating
                        size="large"
                    />
                </View>}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        ...Platform.select({
            ios: { paddingTop: 30 },
        })
    },
    content: {
        flex: 1,
    },
    list: {
        backgroundColor: "#FFF"
    },
    separator: {
        borderWidth: 1,
        borderColor: "#F5F5F5",
    },
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, .2)',
    }
});

export default App;